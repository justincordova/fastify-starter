# Fastify Starter

A production-grade Node.js + TypeScript [Fastify](https://fastify.dev) API starter.
Idiomatic Fastify with schema-first validation, structured logging, security
plugins, OpenAPI docs, and a graceful lifecycle.

## Stack

- **Runtime:** Node.js 26 LTS (ESM)
- **Framework:** Fastify v5
- **Validation:** TypeBox JSON schemas (request validation + response serialization + inferred types)
- **Logging:** Pino (pretty in development, JSON in production)
- **Lint/format:** Biome
- **Tests:** Vitest (service unit tests + `app.inject()` integration tests)
- **Env:** `@fastify/env` with boot-time validation
- **Lifecycle:** `close-with-grace`
- **Plugins:** cors, helmet, compression, rate-limit, sensible, under-pressure, swagger
- **Tooling:** Husky + lint-staged + commitlint, GitHub Actions CI, Dependabot

## Prerequisites

- Node.js 26 or newer
- [pnpm](https://pnpm.io) 12 or newer. Corepack is no longer bundled with Node
  25+, so either install pnpm directly or run `npm i -g corepack && corepack enable`.
  Corepack must be 0.34.6 or newer; older versions cannot launch pnpm 12's native binary.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The server starts on `http://localhost:3000`.

## Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Start in watch mode (tsx)                |
| `pnpm build`      | Compile to `dist/` (tsc + tsc-alias)     |
| `pnpm start`      | Run the compiled server                  |
| `pnpm test`       | Run the test suite once                  |
| `pnpm test:watch` | Run tests in watch mode                  |
| `pnpm coverage`   | Run tests and generate a coverage report |
| `pnpm lint`       | Lint with Biome                          |
| `pnpm format`     | Format with Biome                        |
| `pnpm typecheck`  | Type-check without emitting              |

## Project Structure

```
src/
├── app.ts                # buildApp() factory: plugins, handlers, routes
├── server.ts             # entry point: listen + graceful shutdown
├── config/env.ts         # TypeBox env schema
├── constants/            # HTTP status codes, messages
├── plugins/              # env, security, sensible, under-pressure, swagger
├── modules/example/      # schemas, routes, controllers, services
├── types/fastify.d.ts    # typed fastify.config augmentation
├── utils/response.ts     # standard response envelope helpers
└── tests/                # unit + integration tests
```

## Endpoints

| Method | Path               | Description                      |
| ------ | ------------------ | -------------------------------- |
| GET    | `/`                | API info                         |
| GET    | `/health`          | Health check (under-pressure)    |
| GET    | `/docs`            | Swagger UI (non-production only) |
| GET    | `/api/example`     | List examples                    |
| POST   | `/api/example`     | Create an example                |
| GET    | `/api/example/:id` | Get an example                   |
| PUT    | `/api/example/:id` | Update an example                |
| DELETE | `/api/example/:id` | Delete an example                |

All responses use a standard envelope: `{ success, data?, error?, message?, count?, details? }`.

## Docker

```bash
docker compose up --build
```

The image is a multi-stage `node:26-slim` build with production dependencies only.
It runs as the unprivileged `node` user, has a built-in `HEALTHCHECK` on
`/health`, and runs Node as PID 1 so `SIGTERM` triggers a graceful shutdown.

## Notes

- **`/health`** returns a lean `{ "status": "ok" }` from `@fastify/under-pressure`.
  It intentionally does not include memory statistics.
- **`NODE_ENV`** must be set in the real process environment (shell or Docker
  `ENV`), not only in `.env`. The logger mode is selected at startup before the
  env file is loaded, so a `.env`-only `NODE_ENV=production` would still produce
  development-style (pretty) logs.
- **Commits** must follow [Conventional Commits](https://www.conventionalcommits.org)
  (enforced by commitlint).

## License

MIT
