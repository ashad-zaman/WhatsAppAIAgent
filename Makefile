.PHONY: help build build-prod push clean logs

# Docker build optimizations for WhatsApp AI Platform

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Build all services
build: ## Build all Docker images
	@echo "Building all services..."
	docker-compose build --parallel

# Build specific service
build-service: ## Build specific service (e.g., make build-service SERVICE=api-gateway)
	docker-compose build $(SERVICE)

# Build with no cache (fresh build)
build-no-cache: ## Build all images without cache
	@echo "Building all services without cache..."
	docker-compose build --no-cache --parallel

# Build production images with buildkit
build-prod: ## Build optimized production images using BuildKit
	@echo "Building production images with BuildKit..."
	DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml build

# Push images to registry
push: ## Push images to registry (set REGISTRY env var)
	@for service in api-gateway agent-service rag-service messaging-service workflow-orchestrator dashboard; do \
		docker tag whatsappai-$$service:latest $(REGISTRY)/whatsapp-ai/$$service:latest; \
		docker push $(REGISTRY)/whatsapp-ai/$$service:latest; \
	done

# Clean up Docker resources
clean: ## Remove all stopped containers and unused images
	@echo "Cleaning up Docker resources..."
	docker-compose down -v --rmi local || true
	docker system prune -f

# View logs
logs: ## View logs (e.g., make logs SERVICE=api-gateway)
	docker-compose logs -f $(SERVICE)

# Run tests in containers
test: ## Run tests in containers
	docker-compose run --rm api-gateway npm test
	docker-compose run --rm agent-service npm test

# Security scan
scan: ## Run security scan on images (requires trivy)
	@echo "Running security scan..."
	@for image in $$(docker-compose images -q); do \
		echo "Scanning $$image..."; \
		trivy image $$image || true; \
	done

# Analyze image sizes
size: ## Show image sizes
	@echo "Docker image sizes:"
	@docker images | grep whatsapp-ai

# Shell into container
shell: ## Shell into container (e.g., make shell SERVICE=api-gateway)
	docker-compose exec $(SERVICE) sh

# Multi-platform build
buildx: ## Build multi-platform images (amd64, arm64)
	@echo "Building multi-platform images..."
	docker buildx create --use
	docker buildx build --platform linux/amd64,linux/arm64 \
		-t whatsappai-api-gateway:latest \
		-t whatsappai-agent-service:latest \
		-t whatsappai-rag-service:latest \
		-t whatsappai-messaging-service:latest \
		-t whatsappai-workflow-orchestrator:latest \
		-t whatsappai-dashboard:latest \
		--push \
		--cache-from type=registry,ref=whatsappai/buildcache:latest \
		--cache-to type=registry,ref=whatsappai/buildcache:latest,mode=max \
		.
