# syntax=docker/dockerfile:1.7
# ============================================
# WhatsApp AI - Agent Service
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

RUN pnpm build --filter=@whatsapp-ai/agent-service

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 agent

RUN apk add --no-cache dumb-init tini

COPY --from=builder --chown=agent:nodejs /app/services/agent/dist ./dist
COPY --from=builder --chown=agent:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=agent:nodejs /app/packages ./packages

RUN chown -R agent:agent /app

USER agent

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/index.js"]
