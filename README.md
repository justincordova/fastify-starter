# fastify-starter

A production-grade Node.js + TypeScript [Fastify](https://fastify.dev) API starter.
Idiomatic Fastify with schema-first validation, structured logging, security
plugins, OpenAPI docs, and a graceful lifecycle.

## Stack

- **Runtime:** Node.js 22 (ESM)
- **Framework:** Fastify v5
- **Validation:** TypeBox JSON schemas (request validation + response serialization + inferred types)
- **Logging:** Pino (pretty in development, JSON in production)
- **Lint/format:** Biome
- **Tests:** Vitest (service unit tests + `app.inject()` integration tests)
- **Env:** `@fastify/env` with boot-time validation
- **Lifecycle:** `close-with-grace`
- **Plugins:** cors, helmet, compression, rate-limit, sensible, under-pressure, swagger

## Prerequisites

- Node.js >= 22
- [pnpm](https://pnpm.io) (via Corepack: `corepack enable`)

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The server starts on `http://localhost:3000`.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start in watch mode (tsx) |
| `pnpm build` | Compile to `dist/` (tsc + tsc-alias) |
| `pnpm start` | Run the compiled server |
| `pnpm test` | Run the test suite once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Lint with Biome |
| `pnpm format` | Format with Biome |
| `pnpm typecheck` | Type-check without emitting |

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

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check (under-pressure) |
| GET | `/docs` | Swagger UI (non-production only) |
| GET | `/api/example` | List examples |
| POST | `/api/example` | Create an example |
| GET | `/api/example/:id` | Get an example |
| PUT | `/api/example/:id` | Update an example |
| DELETE | `/api/example/:id` | Delete an example |

All responses use a standard envelope: `{ success, data?, error?, message?, count?, details? }`.

## Docker

```bash
docker compose up --build
```

The image is a multi-stage build (`node:22-slim`) running `node dist/server.js`.

## Notes

- **`/health`** returns a lean `{ "status": "ok" }` from `@fastify/under-pressure`.
  It intentionally does not include memory statistics.
- **`NODE_ENV`** must be set in the real process environment (shell or Docker
  `ENV`), not only in `.env`. The logger mode is selected at startup before the
  env file is loaded, so a `.env`-only `NODE_ENV=production` would still produce
  development-style (pretty) logs.

## License

MIT
