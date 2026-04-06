# syntax=docker/dockerfile:1
# Uses esbuild to bundle all TypeScript (incl. workspace deps) into a single JS file.

# ─── Stage 1: bundle ─────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Install only what's needed to bundle
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/realtime/package.json ./packages/realtime/
COPY packages/shared/package.json ./packages/shared/

# Install deps including devDeps (we need esbuild & tsx for bundling)
RUN pnpm install --frozen-lockfile --filter @slideshow/realtime... --filter @slideshow/shared

# Copy source
COPY packages/realtime/src/ ./packages/realtime/src/
COPY packages/realtime/tsconfig.json ./packages/realtime/tsconfig.json
COPY packages/shared/src/ ./packages/shared/src/

# Bundle everything into a single dist/server.js using esbuild
RUN node_modules/.bin/esbuild \
      packages/realtime/src/server.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --packages=external \
      --outfile=packages/realtime/dist/server.js \
      --tsconfig=packages/realtime/tsconfig.json 2>&1 || \
    # Fallback: bundle with paths resolving shared manually
    node_modules/.bin/esbuild \
      packages/realtime/src/server.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --outfile=packages/realtime/dist/server.js

# ─── Stage 2: runner ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 realtime

# Copy bundled server and runtime dependencies
COPY --from=builder /app/packages/realtime/dist/server.js ./server.js
COPY --from=builder /app/packages/realtime/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER realtime

EXPOSE 3001
ENV PORT=3001

CMD ["node", "server.js"]
