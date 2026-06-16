# syntax=docker/dockerfile:1

# --- Builder stage ---
FROM node:22-slim AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Install dependencies (including dev) using the lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the application
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# Prune to production dependencies
RUN pnpm prune --prod --ignore-scripts

# --- Runtime stage ---
FROM node:22-slim AS runtime

WORKDIR /app

# Install curl for the container healthcheck
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy production node_modules and built output from the builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
