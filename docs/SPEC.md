# fastify-starter

## Vision

A production-grade Node.js + TypeScript Fastify API starter template. It is the
sibling to `express-starter` (the Bun/Express reference) and serves as the
canonical Node/Fastify reference. It keeps a parallel modular structure and
response shape while leaning into idiomatic Fastify — plugins, built-in Pino
logging, schema-based validation, and native lifecycle management.

## Goals

- Idiomatic Fastify v5 starter on Node.js + pnpm.
- Modular structure: `modules/<name>/{schemas,routes,controllers,services}`.
- Schema-first validation with TypeBox: automatic request validation, response
  serialization, and inferred TypeScript types from a single source.
- Built-in batteries over hand-rolled middleware: Pino logging, Fastify request
  IDs, native graceful shutdown.
- Security via plugins: cors, helmet, compression, rate-limit, sensible.
- Auto-generated OpenAPI docs from route schemas (swagger + swagger-ui).
- Boot-time env validation via `@fastify/env`, exposed as a typed `fastify.config`.
- Biome for lint + format (replaces ESLint + Prettier); Vitest for tests.
- Containerized (Docker + docker-compose), CI (GitHub Actions), enforced
  pre-commit gate (Husky + lint-staged).
- Stdout-only structured logging (Pino JSON); no file logging or `logs/` dir.
- `LICENSE` (ported from `express-starter`) and a `README` covering setup,
  scripts, structure, and the `/docs` endpoint.
- Preserve the `{ success, data?, error?, message?, count? }` response envelope
  for parity with `express-starter`.

## Non-Goals

- No database or ORM — the example module uses an in-memory store.
- No authentication / session system.
- Not a Bun template (that role belongs to `express-starter`); Node is the target runtime.
- No monorepo / multi-service setup.

## Architecture

High-level: a Fastify v5 application assembled by a `buildApp()` factory that
registers plugins and routes and sets global error/notFound handlers. A thin
`server.ts` entry point builds the app, validates env, listens, and wires
graceful shutdown. Cross-cutting concerns (security, env, docs, health) are
encapsulated Fastify plugins. Feature code lives in self-contained modules.

### Key Components

- **`src/app.ts`** — `buildApp()` factory: creates Fastify (Pino logger config,
  `requestIdHeader: 'x-request-id'`, built-in request IDs), registers plugins,
  sets `setErrorHandler` / `setNotFoundHandler`, then registers routes (handlers
  before routes — see Edge Cases). Returns an instance without calling `listen`
  (testable via `app.inject()`).
- **`src/server.ts`** — entry point: builds the app, reads validated
  `app.config`, listens, and registers `close-with-grace`.
- **`src/plugins/`** — encapsulated plugins: `env` (`@fastify/env`), `security`
  (cors/helmet/compress/rate-limit), `sensible`, `under-pressure`, `swagger`
  (+ swagger-ui).
- **`src/modules/<name>/`** — `schemas.ts` (TypeBox + inferred types),
  `routes.ts` (route defs with `{ schema }`), `controllers.ts` (async handlers),
  `services.ts` (business logic + in-memory store + `resetExamples()`).
- **`src/utils/response.ts`** — `sendSuccess` / `sendCreated` / `sendError` and
  the `ApiResponse<T>` envelope, adapted to `reply`.
- **`src/config/env.ts`** — TypeBox env schema consumed by `@fastify/env`.
  Variables: `NODE_ENV`, `PORT`, `APP_NAME`, `LOG_LEVEL`, `ALLOWED_ORIGINS`
  (comma-separated string, split into an array for `@fastify/cors`),
  `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`. Mirrored in `.env.example`.
- **`src/constants/index.ts`** — `HTTP_STATUS`, shared messages.
- **`src/types/fastify.d.ts`** — module augmentation typing `fastify.config`.

### Data Flow

```
request → Fastify (req.id, pino log)
        → schema validation (body/params/query via TypeBox)  → auto 400 on fail
        → controller handler (req, reply)
        → service (pure business logic, in-memory store)
        → response helper → reply.send()  (schema-serialized)
```

Routes (parity with the Bun starter):

- `GET /` — API info + endpoint list
- `GET /health` — provided by `@fastify/under-pressure`; returns a lean
  `{ status: "ok" }` (the plugin monitors event-loop/memory pressure internally
  for 503 shedding, but the route payload is intentionally minimal)
- `GET /docs` — swagger-ui (registered in non-production only)
- `GET /api/example`, `POST /api/example`, `GET|PUT|DELETE /api/example/:id`

Errors thrown in async handlers route to `setErrorHandler`, which logs via
`req.log.error`, maps `err.statusCode`, hides internals in production, and
reshapes the response (including validation 400s) into the standard envelope.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Port philosophy | Idiomatic Fastify | Use native plugins/logging/validation rather than translating Express 1:1 |
| Runtime / PM | Node + pnpm | Canonical Fastify setup; the Node reference, distinct from the Bun template |
| Lint/format | Biome | One fast tool replacing ESLint + Prettier; single config |
| Test runner | Vitest | Fast, Jest-compatible API, strong TS/ESM + path-alias support |
| Dev / build | tsx (dev) + tsc + tsc-alias (build) | Instant dev reload; `tsc` compiles to `dist/`, `tsc-alias --resolve-full-paths` rewrites `@/*` aliases and adds `.js` extensions for Node ESM |
| Validation | TypeBox + Fastify schemas | Typesafe JSON Schema; auto validation + serialization + inferred types |
| Env | `@fastify/env` + TypeBox | Fail-fast boot validation; typed `fastify.config`; consistent with schema-first approach |
| Entry point | `buildApp()` factory + `server.ts` | Testable via `inject()`; separates wiring from listen/shutdown |
| Lifecycle | `close-with-grace` | Idiomatic graceful shutdown; replaces manual signal plumbing |
| Response shape | Keep `ApiResponse` envelope + helpers | Parity with `express-starter` |
| Logging output | Stdout-only Pino JSON | 12-factor / container-native; drops Winston file transports |
| Body limit | 1MB (Fastify default) | Smaller attack surface; override per-route if needed |
| Node version | 22 LTS | Current active LTS; pinned via `.nvmrc` + `engines` |
| Module system | ESM (`type: module`, `module: ESNext`, `moduleResolution: Bundler`) | ESM output for modern Node; `Bundler` resolution permits extensionless `@/*` alias imports (NodeNext rejects them), with `tsc-alias` rewriting aliases at build |
| Health route | `@fastify/under-pressure` built-in `/health` | Single source of truth; avoids conflict with a custom route |
| Docs exposure | `/docs` in non-production only | Avoid publishing API schema publicly by default |
| Repo name | `fastify-starter` | User preference; `package.json` name matches |

## Edge Cases & Constraints

- Validation 400s must be reshaped to the standard envelope (Fastify's default
  error shape differs).
- Production logging uses raw Pino JSON; `pino-pretty` only in development.
- `fastify.config` typing requires module augmentation in `src/types/fastify.d.ts`.
- Path aliases (`@/*`) resolve via three mechanisms that must stay in sync: tsx
  (dev), `tsc-alias --resolve-full-paths` (build → relative `.js` imports), and a
  Vitest `resolve.alias` (tests).
- Global error/notFound handlers must be registered in `buildApp()` BEFORE the
  encapsulated route plugins. Registering routes first causes their child
  encapsulation context to capture Fastify's default error handler, so
  validation errors bypass the standard envelope.
- Route `response` schemas declare success statuses only (200/201). Attaching
  error-status schemas (400/404) triggers `FST_ERR_FAILED_ERROR_SERIALIZATION`
  because the global handler's envelope is serialized against a mismatched
  schema. Error envelopes are guaranteed by the global handler.
- pnpm 11 specifics (committed to the template): `pnpm-workspace.yaml` declares
  `allowBuilds` with `@biomejs/biome: false` and `esbuild: false` — pnpm 11
  exits non-zero on install until each dependency build script is acknowledged;
  both ship prebuilt binaries so they are acknowledged as "do not build". `.npmrc`
  sets `verify-deps-before-run=false` as additional robustness for the pre-script
  deps check. The `prepare` script is `husky || true` so a husky failure cannot
  break `pnpm install` in CI/Docker.
- Node version pinned via `.nvmrc` + `engines`; pnpm pinned via `packageManager`
  (Corepack).
- Tests cover both layers: service unit tests and an `app.inject()` integration
  test for the example routes.
- `ALLOWED_ORIGINS` is a comma-separated env string; the security plugin splits
  it into an array for `@fastify/cors`.
- Rate limiting allowlists `/health` and `/docs` so monitoring and docs are not
  throttled.
- ESM constraints: relative imports may need explicit extensions; use
  `import.meta.url` instead of `__dirname` where a path is required.

## Open Questions

- None.

## References

- Sibling template: `../express-starter` (Bun/Express reference)
- Fastify v5 docs, TypeBox, Biome, Vitest
