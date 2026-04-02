# WhatsApp AI - Docker Base Images

This package contains shared Docker base images for the WhatsApp AI platform.

## Images

### Node Base (`node-base`)
- Alpine-based Node.js 20 image
- Pre-installed with pnpm, dumb-init, tini
- Optimized for microservices

### Next.js Base (`next-base`)
- Alpine-based Node.js 20 image
- Pre-configured for Next.js applications
- Includes bash for script support

## Building

```bash
# Build images locally
./build.sh

# Build and push to registry
PUSH=true ./build.sh

# With custom registry
DOCKER_REGISTRY=my-registry.com VERSION=1.0.0 ./build.sh
```

## Usage

In your service Dockerfile:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM ghcr.io/whatsapp-ai/node-base:20-alpine AS runner

WORKDIR /app
# ... rest of your Dockerfile
```
