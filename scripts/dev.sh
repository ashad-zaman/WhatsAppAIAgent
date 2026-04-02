#!/bin/bash

# WhatsApp AI Platform - Development Script
# Usage: ./scripts/dev.sh [service] [options]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# Default values
SERVICE=""
BUILD=false
LOGS=false
SHELL=false
TEST=false
PORT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $# in
        api-gateway|agent|rag|messaging|workflow|dashboard)
            SERVICE="$1"
            shift
            ;;
        --build)
            BUILD=true
            shift
            ;;
        --logs)
            LOGS=true
            shift
            ;;
        --shell)
            SHELL=true
            shift
            ;;
        --test)
            TEST=true
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --help)
            echo "WhatsApp AI Platform - Development Script"
            echo ""
            echo "Usage: ./scripts/dev.sh [service] [options]"
            echo ""
            echo "Services:"
            echo "  api-gateway   - API Gateway (Express.js)"
            echo "  agent         - Agent Service (AI orchestration)"
            echo "  rag           - RAG Service (Graph RAG)"
            echo "  messaging     - Messaging Service (WhatsApp)"
            echo "  workflow      - Workflow Service (Temporal)"
            echo "  dashboard     - Dashboard (Next.js)"
            echo "  all           - All services (default)"
            echo ""
            echo "Options:"
            echo "  --build       Rebuild before starting"
            echo "  --logs        Show logs after starting"
            echo "  --shell       Open shell in container"
            echo "  --test        Run tests"
            echo "  --port <num>  Use specific port"
            echo "  --help        Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Default to all services
SERVICE="${SERVICE:-all}"

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

# Service mappings
declare -A SERVICE_PORTS=(
    ["api-gateway"]="3000"
    ["dashboard"]="3001"
    ["agent"]="3002"
    ["rag"]="3003"
    ["messaging"]="3004"
    ["workflow"]="3005"
)

declare -A SERVICE_CONTAINERS=(
    ["api-gateway"]="api-gateway"
    ["dashboard"]="dashboard"
    ["agent"]="agent-service"
    ["rag"]="rag-service"
    ["messaging"]="messaging-service"
    ["workflow"]="workflow-orchestrator"
)

# Check Docker status
check_docker() {
    if ! docker info &> /dev/null; then
        echo_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    echo_step "Checking prerequisites..."

    # Check if .env exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo_warning ".env file not found. Run ./scripts/setup.sh first."
        if [ "$SERVICE" != "all" ]; then
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            echo_success "Created .env from .env.example"
        fi
    fi

    # Check if dependencies are installed
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        echo_step "Installing dependencies..."
        cd "$PROJECT_ROOT" && pnpm install
    fi

    echo_success "Prerequisites OK"
}

# Start Docker services
start_docker() {
    echo_step "Starting Docker services..."

    docker compose -f "$COMPOSE_FILE" up -d postgres mongodb redis kafka zookeeper

    # Wait for services
    echo -n "  Waiting for PostgreSQL... "
    until docker compose exec -T postgres pg_isready -U postgres &> /dev/null; do
        sleep 1
    done
    echo -e "${GREEN}ready${NC}"

    echo -n "  Waiting for MongoDB... "
    until docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; do
        sleep 1
    done
    echo -e "${GREEN}ready${NC}"

    echo_success "Docker services started"
}

# Build service
build_service() {
    local svc="$1"
    echo_step "Building $svc..."

    if [ "$svc" = "all" ]; then
        docker compose -f "$COMPOSE_FILE" build
    else
        docker compose -f "$COMPOSE_FILE" build "${SERVICE_CONTAINERS[$svc]}"
    fi

    echo_success "Build complete"
}

# Start specific service
start_service() {
    local svc="$1"

    echo_step "Starting $svc..."

    case $svc in
        api-gateway)
            cd "$PROJECT_ROOT/services/api-gateway"
            pnpm dev
            ;;
        agent)
            cd "$PROJECT_ROOT/services/agent"
            pnpm dev
            ;;
        rag)
            cd "$PROJECT_ROOT/services/rag"
            pnpm dev
            ;;
        messaging)
            cd "$PROJECT_ROOT/services/messaging"
            pnpm dev
            ;;
        workflow)
            cd "$PROJECT_ROOT/services/workflow"
            pnpm dev
            ;;
        dashboard)
            cd "$PROJECT_ROOT/apps/dashboard"
            pnpm dev
            ;;
    esac
}

# Start service in Docker
start_service_docker() {
    local svc="$1"
    local container="${SERVICE_CONTAINERS[$svc]}"

    echo_step "Starting $svc in Docker..."

    if [ "$BUILD" = true ]; then
        docker compose -f "$COMPOSE_FILE" build "$container"
    fi

    docker compose -f "$COMPOSE_FILE" up -d "$container"
    echo_success "$svc started"
}

# Show logs
show_logs() {
    local svc="$1"
    local container="${SERVICE_CONTAINERS[$svc]}"

    if [ "$svc" = "all" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f
    else
        docker compose -f "$COMPOSE_FILE" logs -f "$container"
    fi
}

# Open shell
open_shell() {
    local svc="$1"
    local container="${SERVICE_CONTAINERS[$svc]}"

    echo_step "Opening shell in $container..."
    docker compose -f "$COMPOSE_FILE" exec "$container" sh
}

# Run tests
run_tests() {
    local svc="$1"

    echo_step "Running tests for $svc..."

    case $svc in
        api-gateway)
            cd "$PROJECT_ROOT/services/api-gateway"
            pnpm test
            ;;
        agent)
            cd "$PROJECT_ROOT/services/agent"
            pnpm test
            ;;
        dashboard)
            cd "$PROJECT_ROOT/apps/dashboard"
            pnpm test
            ;;
        all)
            cd "$PROJECT_ROOT"
            pnpm test
            ;;
    esac
}

# Start all services
start_all() {
    check_docker
    check_prerequisites
    start_docker

    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Starting WhatsApp AI Platform${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""

    # Start backend services in background
    echo_step "Starting backend services..."
    cd "$PROJECT_ROOT/services/api-gateway" && pnpm dev &
    cd "$PROJECT_ROOT/services/agent" && pnpm dev &
    cd "$PROJECT_ROOT/services/rag" && pnpm dev &
    cd "$PROJECT_ROOT/services/messaging" && pnpm dev &
    cd "$PROJECT_ROOT/services/workflow" && pnpm dev &

    # Start frontend
    echo_step "Starting dashboard..."
    cd "$PROJECT_ROOT/apps/dashboard" && pnpm dev &

    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Services Started!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Dashboard:  http://localhost:3001"
    echo "  API Gateway: http://localhost:3000"
    echo "  Agent:      http://localhost:3002"
    echo "  RAG:         http://localhost:3003"
    echo "  Messaging:   http://localhost:3004"
    echo "  Workflow:    http://localhost:3005"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    # Wait for all background jobs
    wait
}

# Main
main() {
    cd "$PROJECT_ROOT"

    case "$SERVICE" in
        all)
            start_all
            ;;
        logs)
            show_logs "all"
            ;;
        *)
            if [ "$LOGS" = true ]; then
                show_logs "$SERVICE"
            elif [ "$SHELL" = true ]; then
                open_shell "$SERVICE"
            elif [ "$TEST" = true ]; then
                run_tests "$SERVICE"
            elif [ "$BUILD" = true ]; then
                check_docker
                build_service "$SERVICE"
            else
                start_service "$SERVICE"
            fi
            ;;
    esac
}

main "$@"
