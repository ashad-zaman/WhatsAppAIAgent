#!/bin/bash

# WhatsApp AI Platform - Development Setup Script
# Usage: ./scripts/setup.sh [options]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# Default values
SKIP_DOCKER=false
SKIP_DEPENDENCIES=false
SKIP_DB=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $# in
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPENDENCIES=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            echo "WhatsApp AI Platform Setup Script"
            echo ""
            echo "Usage: ./scripts/setup.sh [options]"
            echo ""
            echo "Options:"
            echo "  --skip-docker    Skip Docker services setup"
            echo "  --skip-deps      Skip dependency installation"
            echo "  --skip-db        Skip database setup"
            echo "  --force          Overwrite existing files"
            echo "  --help           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo_step() {
    echo -e "${BLUE}==>${NC} $1"
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo_step "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo_error "Node.js is not installed. Please install Node.js >= 20.0.0"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo_error "Node.js version must be >= 20.0.0. Current: $(node -v)"
        exit 1
    fi
    echo_success "Node.js $(node -v)"

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        echo_warning "pnpm not found. Installing..."
        npm install -g pnpm
    fi
    echo_success "pnpm $(pnpm -V)"

    # Check Docker
    if command -v docker &> /dev/null; then
        echo_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
    else
        echo_warning "Docker not found. Some features may not work."
    fi

    # Check Git
    if command -v git &> /dev/null; then
        echo_success "Git $(git --version | cut -d' ' -f3)"
    else
        echo_error "Git is not installed"
        exit 1
    fi
}

# Setup environment file
setup_env() {
    echo_step "Setting up environment file..."

    if [ -f "$ENV_FILE" ] && [ "$FORCE" = false ]; then
        echo_warning "Environment file already exists. Skipping..."
    else
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            echo_success "Created .env from .env.example"
            echo_warning "Please edit .env and configure your secrets"
        else
            echo_warning ".env.example not found. Creating basic .env..."
            cat > "$ENV_FILE" << 'EOF'
# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatsapp_ai
MONGODB_URL=mongodb://localhost:27017/whatsapp_ai
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# Kafka
KAFKA_BROKERS=localhost:9092

# Sentry (optional)
SENTRY_DSN=

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
EOF
            echo_success "Created .env file"
        fi
    fi
}

# Install dependencies
install_dependencies() {
    if [ "$SKIP_DEPENDENCIES" = true ]; then
        echo_warning "Skipping dependency installation"
        return
    fi

    echo_step "Installing dependencies..."

    # Install pnpm if needed
    if ! command -v pnpm &> /dev/null; then
        npm install -g pnpm
    fi

    # Install project dependencies
    pnpm install

    echo_success "Dependencies installed"
}

# Setup Docker services
setup_docker() {
    if [ "$SKIP_DOCKER" = true ]; then
        echo_warning "Skipping Docker setup"
        return
    fi

    if ! command -v docker &> /dev/null; then
        echo_warning "Docker not found. Skipping Docker setup..."
        return
    fi

    echo_step "Setting up Docker services..."

    # Check if Docker is running
    if ! docker info &> /dev/null; then
        echo_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Pull required images
    echo_step "Pulling Docker images..."
    docker compose pull postgres mongodb redis kafka zookeeper

    # Start services
    echo_step "Starting Docker services..."
    docker compose up -d postgres mongodb redis kafka zookeeper

    # Wait for services to be ready
    echo_step "Waiting for services to be ready..."

    # Wait for PostgreSQL
    echo -n "  PostgreSQL... "
    until docker compose exec -T postgres pg_isready -U postgres &> /dev/null; do
        sleep 1
    done
    echo -e "${GREEN}ready${NC}"

    # Wait for MongoDB
    echo -n "  MongoDB... "
    until docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; do
        sleep 1
    done
    echo -e "${GREEN}ready${NC}"

    # Wait for Redis
    echo -n "  Redis... "
    until docker compose exec -T redis redis-cli ping &> /dev/null; do
        sleep 1
    done
    echo -e "${GREEN}ready${NC}"

    # Wait for Kafka
    echo -n "  Kafka... "
    until docker compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list &> /dev/null; do
        sleep 1
    done
    echo -e "${GREEN}ready${NC}"

    echo_success "Docker services started"
}

# Setup databases
setup_databases() {
    if [ "$SKIP_DB" = true ]; then
        echo_warning "Skipping database setup"
        return
    fi

    echo_step "Setting up databases..."

    # Create PostgreSQL database
    echo_step "Creating PostgreSQL database..."
    docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE whatsapp_ai;" 2>/dev/null || true
    docker compose exec -T postgres psql -U postgres -d whatsapp_ai -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
    docker compose exec -T postgres psql -U postgres -d whatsapp_ai -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" 2>/dev/null || true

    # Run Prisma migrations
    if [ -d "$PROJECT_ROOT/packages/database" ]; then
        echo_step "Running Prisma migrations..."
        cd "$PROJECT_ROOT/packages/database"
        pnpm prisma migrate dev --name init 2>/dev/null || echo_warning "Migration may have already been applied"
        cd "$PROJECT_ROOT"
    fi

    # Create MongoDB collections
    echo_step "Creating MongoDB collections..."
    docker compose exec -T mongodb mongosh --eval "
        db = db.getSiblingDB('whatsapp_ai');
        db.createCollection('messages');
        db.createCollection('conversations');
        db.createCollection('sessions');
        db.createCollection('audit_logs');
        db.messages.createIndex({ userId: 1, createdAt: -1 });
        db.conversations.createIndex({ participant: 1, updatedAt: -1 });
    " &> /dev/null || echo_warning "MongoDB collections may already exist"

    echo_success "Databases set up"
}

# Create necessary directories
create_directories() {
    echo_step "Creating directories..."

    mkdir -p "$PROJECT_ROOT/data/postgres"
    mkdir -p "$PROJECT_ROOT/data/mongodb"
    mkdir -p "$PROJECT_ROOT/data/redis"
    mkdir -p "$PROJECT_ROOT/logs"
    mkdir -p "$PROJECT_ROOT/.tmp"

    echo_success "Directories created"
}

# Setup Git hooks
setup_git_hooks() {
    echo_step "Setting up Git hooks..."

    if [ -f "$PROJECT_ROOT/.husky/pre-commit" ]; then
        echo_warning "Git hooks already set up"
    else
        pnpm prepare
    fi
}

# Verify setup
verify_setup() {
    echo_step "Verifying setup..."

    local errors=0

    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        echo_error ".env file not found"
        ((errors++))
    fi

    # Check node_modules
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        echo_error "node_modules not found. Run: pnpm install"
        ((errors++))
    fi

    # Check critical environment variables
    source "$ENV_FILE" 2>/dev/null || true
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-in-production" ]; then
        echo_warning "JWT_SECRET not configured in .env"
    fi

    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "sk-your-openai-api-key" ]; then
        echo_warning "OPENAI_API_KEY not configured in .env"
    fi

    if [ $errors -gt 0 ]; then
        echo_error "Setup verification failed with $errors error(s)"
        return 1
    fi

    echo_success "Setup verified"
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo -e "  ${BLUE}1.${NC} Edit .env and configure your secrets"
    echo -e "  ${BLUE}2.${NC} Start development server:"
    echo -e "     ${YELLOW}pnpm dev${NC}"
    echo ""
    echo -e "  ${BLUE}Or start individual services:${NC}"
    echo -e "     ${YELLOW}pnpm dev --filter=api-gateway${NC}"
    echo -e "     ${YELLOW}pnpm dev --filter=dashboard${NC}"
    echo -e "     ${YELLOW}pnpm dev --filter=agent-service${NC}"
    echo ""
    echo -e "  ${BLUE}Run tests:${NC}"
    echo -e "     ${YELLOW}pnpm test${NC}"
    echo -e "     ${YELLOW}pnpm test:watch${NC}"
    echo ""
    echo -e "  ${BLUE}Docker commands:${NC}"
    echo -e "     ${YELLOW}make docker:up${NC}      - Start all services"
    echo -e "     ${YELLOW}make docker:down${NC}    - Stop all services"
    echo -e "     ${YELLOW}make logs${NC}          - View logs"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  WhatsApp AI Platform - Development Setup${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""

    check_prerequisites
    setup_env
    install_dependencies
    create_directories
    setup_docker
    setup_databases
    setup_git_hooks
    verify_setup
    print_next_steps
}

main "$@"
