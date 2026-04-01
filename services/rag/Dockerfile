# syntax=docker/dockerfile:1.7
# ============================================
# WhatsApp AI - RAG Service
# Optimized for production with multi-stage build
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm@9@latest

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/
COPY services/*/package.json services/

RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services ./services
COPY . .

RUN pnpm build --filter=@whatsapp-ai/rag-service

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 rag

RUN apk add --no-cache dumb-init tini

COPY --from=builder --chown=rag:nodejs /app/services/rag/dist ./dist
COPY --from=builder --chown=rag:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=rag:nodejs /app/packages ./packages

RUN chown -R rag:rag /app

USER rag

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

EXPOSE 3002

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/index.js"]
