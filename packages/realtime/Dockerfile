# syntax=docker/dockerfile:1
# Bundles TypeScript source (including workspace deps) into a single JS file.

# ─── Stage 1: install & bundle ───────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/realtime/package.json ./packages/realtime/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --filter @slideshow/realtime... --filter @slideshow/shared

COPY packages/realtime/src/ ./packages/realtime/src/
COPY packages/realtime/tsconfig.json ./packages/realtime/tsconfig.json
COPY packages/shared/src/ ./packages/shared/src/

# Bundle everything into one file (avoids pnpm symlink issues in the runner)
# Mark only native optional modules as external
RUN packages/realtime/node_modules/.bin/esbuild \
      packages/realtime/src/server.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --alias:@slideshow/shared=./packages/shared/src/index.ts \
      --external:bufferutil \
      --external:utf-8-validate \
      --external:supports-color \
      --outfile=packages/realtime/dist/server.js

# ─── Stage 2: runner ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 realtime

# Copy bundled server (fully self-contained, no node_modules needed)
COPY --from=builder /app/packages/realtime/dist/server.js ./server.js

USER realtime

EXPOSE 3001
ENV PORT=3001

CMD ["node", "server.js"]
