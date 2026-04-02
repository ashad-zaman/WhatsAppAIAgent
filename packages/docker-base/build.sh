#!/bin/bash
# ============================================
# WhatsApp AI - Docker Base Image Build Script
# ============================================

set -e

REGISTRY="${DOCKER_REGISTRY:-ghcr.io/whatsapp-ai}"
VERSION="${VERSION:-latest}"

echo "Building Docker base images..."
echo "Registry: $REGISTRY"
echo "Version: $VERSION"

# Build Node.js base image
echo "Building node-base image..."
docker build \
    --platform linux/amd64,linux/arm64 \
    --tag "$REGISTRY/node-base:20-alpine" \
    --tag "$REGISTRY/node-base:$VERSION" \
    ./node-base

# Build Next.js base image
echo "Building next-base image..."
docker build \
    --platform linux/amd64,linux/arm64 \
    --tag "$REGISTRY/next-base:20-alpine" \
    --tag "$REGISTRY/next-base:$VERSION" \
    ./next-base

# Push images
if [ "$PUSH" = "true" ]; then
    echo "Pushing images to registry..."
    docker push "$REGISTRY/node-base:20-alpine"
    docker push "$REGISTRY/node-base:$VERSION"
    docker push "$REGISTRY/next-base:20-alpine"
    docker push "$REGISTRY/next-base:$VERSION"
fi

echo "Done building base images!"
