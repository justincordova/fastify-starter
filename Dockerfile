# syntax=docker/dockerfile:1

# --- Base: Node + pnpm (Corepack is no longer bundled with Node 25+) ---
FROM node:26-slim AS base
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install --global corepack@0.36.0 && corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Download the pnpm version pinned in package.json once, shared by later stages
RUN corepack install

# --- Production dependencies only ---
FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  pnpm install --prod --frozen-lockfile --ignore-scripts

# --- Build ---
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# --- Runtime ---
FROM node:26-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Files stay root-owned (read-only to the app); the process runs as the unprivileged `node` user
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 3000}/health`).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# Exec form: Node is PID 1 and receives SIGTERM directly for graceful shutdown
CMD ["node", "dist/server.js"]
