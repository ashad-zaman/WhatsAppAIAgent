#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "WhatsApp AI Platform - Deploy Script"
echo "========================================="

usage() {
    echo "Usage: $0 [environment]"
    echo "  environment: dev, staging, production (default: production)"
    exit 1
}

ENVIRONMENT="${1:-production}"

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    echo "Error: Invalid environment '$ENVIRONMENT'"
    usage
fi

echo "Deploying to: $ENVIRONMENT"

cd "$PROJECT_ROOT"

echo ""
echo "[1/6] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required but not installed. Aborting."; exit 1; }

echo ""
echo "[2/6] Running database migrations..."
if [ "$ENVIRONMENT" = "production" ]; then
    pnpm db:migrate:deploy
else
    pnpm db:migrate
fi

echo ""
echo "[3/6] Building all packages and services..."
pnpm build

echo ""
echo "[4/6] Building Docker images..."
docker build -f apps/dashboard/Dockerfile -t whatsapp-ai/dashboard:$ENVIRONMENT apps/dashboard
docker build -f services/api-gateway/Dockerfile -t whatsapp-ai/api-gateway:$ENVIRONMENT services/api-gateway
docker build -f services/agent/Dockerfile -t whatsapp-ai/agent-service:$ENVIRONMENT services/agent

echo ""
echo "[5/6] Pushing images to registry..."
if [ -n "$DOCKER_REGISTRY" ]; then
    docker tag whatsapp-ai/dashboard:$ENVIRONMENT $DOCKER_REGISTRY/whatsapp-ai/dashboard:$ENVIRONMENT
    docker tag whatsapp-ai/api-gateway:$ENVIRONMENT $DOCKER_REGISTRY/whatsapp-ai/api-gateway:$ENVIRONMENT
    docker tag whatsapp-ai/agent-service:$ENVIRONMENT $DOCKER_REGISTRY/whatsapp-ai/agent-service:$ENVIRONMENT
    
    docker push $DOCKER_REGISTRY/whatsapp-ai/dashboard:$ENVIRONMENT
    docker push $DOCKER_REGISTRY/whatsapp-ai/api-gateway:$ENVIRONMENT
    docker push $DOCKER_REGISTRY/whatsapp-ai/agent-service:$ENVIRONMENT
fi

echo ""
echo "[6/6] Deploying to $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
    kubectl apply -f k8s/production/
    kubectl rollout status deployment/api-gateway
    kubectl rollout status deployment/agent-service
    kubectl rollout status deployment/dashboard
elif [ "$ENVIRONMENT" = "staging" ]; then
    kubectl apply -f k8s/staging/
else
    echo "Dev environment - skipping k8s deployment"
    echo "Run 'docker-compose up' to start services locally"
fi

echo ""
echo "========================================="
echo "Deployment to $ENVIRONMENT complete!"
echo "========================================="
