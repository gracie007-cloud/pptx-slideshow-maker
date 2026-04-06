# syntax=docker/dockerfile:1
# ─── Stage 1: deps ───────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/realtime/package.json ./packages/realtime/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --filter @slideshow/realtime... --filter @slideshow/shared

# ─── Stage 2: builder ────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/realtime/node_modules ./packages/realtime/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true

COPY packages/realtime/ ./packages/realtime/
COPY packages/shared/ ./packages/shared/
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./

RUN cd packages/shared && pnpm run build 2>/dev/null || true
RUN cd packages/realtime && pnpm run build

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
