# syntax=docker/dockerfile:1.7
# ============================================
# WhatsApp AI - Dashboard (Next.js)
# Optimized for production with multi-stage build
# ============================================

# Stage 1: Base dependencies
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9@latest

# Stage 2: Install dependencies only
FROM base AS deps
WORKDIR /app

# Copy lockfile and package files for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/

RUN pnpm install --frozen-lockfile --prod=false

# Stage 3: Builder
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm build --filter=@whatsapp-ai/dashboard

# Stage 4: Runner - Minimal production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production

# Copy built artifacts with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./public/_next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./public

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Health check for Next.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENV PORT=3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
