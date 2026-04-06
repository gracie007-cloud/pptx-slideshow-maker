# syntax=docker/dockerfile:1
# ─── Stage 1: deps ───────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/realtime/package.json ./packages/realtime/

# Skip canvas/puppeteer native builds (not needed in server-side Next.js)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV npm_config_build_from_source=false

RUN pnpm install --frozen-lockfile --ignore-scripts && \
    # Re-run scripts only for packages that need them (not canvas)
    pnpm exec prisma --version 2>/dev/null || true

# ─── Stage 2: builder ────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy all installed node_modules from deps stage
COPY --from=deps /app/ ./

# Copy source code
COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/
COPY packages/realtime/package.json ./packages/realtime/

# Use production schema (PostgreSQL)
COPY apps/web/prisma/schema.production.prisma apps/web/prisma/schema.prisma

# Generate Prisma client (this runs the generate script, not canvas)
RUN cd apps/web && npx prisma generate

# Build the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV AUTH_SECRET=build-placeholder-replace-at-runtime
ENV DATABASE_URL=postgresql://user:pass@host/db

RUN cd apps/web && pnpm run build

# ─── Stage 3: runner ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy Prisma client for runtime DB access
COPY --from=builder /app/apps/web/node_modules/.prisma ./apps/web/node_modules/.prisma
COPY --from=builder /app/apps/web/node_modules/@prisma ./apps/web/node_modules/@prisma
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
