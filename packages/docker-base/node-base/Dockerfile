# syntax=docker/dockerfile:1.7
# ============================================
# WhatsApp AI - Node.js Base Image
# Optimized base image with pnpm, dumb-init, tini
# ============================================

FROM node:20-alpine AS base

# Labels
LABEL maintainer="WhatsApp AI Team"
LABEL org.opencontainers.image.source="https://github.com/whatsapp-ai/platform"

# Install essential tools
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    dumb-init \
    tini \
    ca-certificates \
    wget \
    curl \
    zip \
    unzip

# Install pnpm globally
RUN npm install -g pnpm@9@latest

# Create non-root user template
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Set default environment
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Working directory
WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose default port
EXPOSE 3000

# Default command
CMD ["node"]
