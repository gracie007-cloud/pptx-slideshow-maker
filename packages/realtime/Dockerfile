# syntax=docker/dockerfile:1
# ─── Stage 1: deps ───────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/realtime/package.json ./packages/realtime/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --filter @slideshow/realtime... --filter @slideshow/shared

# ─── Stage 2: builder ────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY packages/realtime/ ./packages/realtime/
COPY packages/shared/ ./packages/shared/
COPY tsconfig.base.json ./

# Link workspace packages so @slideshow/shared resolves
RUN mkdir -p packages/realtime/node_modules/@slideshow && \
    ln -s /app/packages/shared packages/realtime/node_modules/@slideshow/shared

# Build shared package (TypeScript → JS)
WORKDIR /app/packages/shared
RUN npx tsc --noEmit false --outDir dist --declaration false --declarationMap false 2>/dev/null || true

# Build realtime server
WORKDIR /app/packages/realtime
RUN npx tsc

# ─── Stage 3: runner ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 realtime

COPY --from=builder /app/packages/realtime/dist ./dist
COPY --from=builder /app/packages/realtime/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER realtime

EXPOSE 3001
ENV PORT=3001

CMD ["node", "dist/server.js"]
