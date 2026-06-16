# fastify-starter Plan

> **Goal:** Scaffold a production-grade Node + TypeScript Fastify v5 API starter, idiomatic Fastify, parallel in structure/response-shape to `../express-starter`.
> **Spec:** `docs/SPEC.md`

All paths are relative to `/Users/justincordova/cs/templates/fastify-starter`.
Reference project for patterns/parity: `/Users/justincordova/cs/templates/express-starter`.

---

## Phase 1: Project Scaffolding & Tooling

**Gate:** `pnpm install` succeeds; `pnpm typecheck`, `pnpm lint`, `pnpm test` run (no source yet — empty/placeholder pass).

### Task 1: package.json, Node/pnpm pinning, dependencies
- **What:** Create `package.json`, `.nvmrc`, and declare all deps.
- **Why:** Everything else depends on the dep tree and scripts existing.
- **How:**
  - `package.json` fields: `"name": "fastify-starter"`, `"version": "1.0.0"`, `"type": "module"`, `"main": "dist/server.js"`, `"packageManager": "pnpm@9.x"` (use a current 9.x), `"engines": { "node": ">=22" }`.
  - Scripts:
    - `"dev": "tsx watch src/server.ts"`
    - `"build": "tsc && tsc-alias"`
    - `"start": "node dist/server.js"`
    - `"test": "vitest run"`
    - `"test:watch": "vitest"`
    - `"lint": "biome check ."`
    - `"format": "biome format --write ."`
    - `"typecheck": "tsc --noEmit"`
    - `"prepare": "husky || true"` (**execute fix:** the bare `husky` lifecycle script can exit non-zero during `pnpm install --frozen-lockfile` under pnpm 11 — and would fail in CI/Docker where husky can't init — so guard it with `|| true`)
  - dependencies: `fastify`, `fastify-plugin`, `@fastify/cors`, `@fastify/helmet`, `@fastify/compress`, `@fastify/rate-limit`, `@fastify/sensible`, `@fastify/under-pressure`, `@fastify/swagger`, `@fastify/swagger-ui`, `@fastify/env`, `@fastify/type-provider-typebox`, `close-with-grace`, `pino`, `pino-pretty`.
    - **C1:** Do NOT add `@sinclair/typebox` directly. `@fastify/type-provider-typebox` re-exports `Type` and `Static` and bundles a matching TypeBox version; importing from a separately-pinned `@sinclair/typebox` is the top cause of broken schema inference. All TypeBox imports come from `@fastify/type-provider-typebox`.
    - **Execute fix (pnpm 11 builds):** pnpm 11 blocks dependency build scripts and exits non-zero on install until acknowledged. Commit `pnpm-workspace.yaml` with `allowBuilds: { "@biomejs/biome": false, esbuild: false }` (both ship prebuilt binaries — acknowledge as "do not build"). `onlyBuiltDependencies` alone does NOT suppress the error; the `allowBuilds` map written by `pnpm approve-builds` is what clears it.
  - devDependencies: `typescript`, `tsx`, `tsc-alias`, `vitest`, `@biomejs/biome`, `husky`, `lint-staged`, `@types/node`.
    - `tsc-alias` rewrites `@/*` aliases in emitted JS (the `build` script chains `tsc && tsc-alias --resolve-full-paths`). **Execute note:** `--resolve-full-paths` is required so emitted ESM imports get explicit `.js` extensions; without it Node's ESM loader throws `ERR_MODULE_NOT_FOUND` at runtime.
    - `fastify-plugin` is a runtime dependency (above) because plugins that decorate the instance (env, sensible) must escape encapsulation.
  - `.nvmrc`: `22`.
- **Verify:** `pnpm install` completes and writes `pnpm-lock.yaml`; `node -v` matches engines locally.

### Task 2: TypeScript config (ESM + path aliases)
- **What:** Create `tsconfig.json`.
- **Why:** tsx, tsc, and vitest all read it; aliases + ESM must resolve identically across all three.
- **How:** compilerOptions:
  - `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "Bundler"`, `"lib": ["ES2022"]`
    - **Deviation (execute):** originally specified `NodeNext`/`NodeNext`, but NodeNext rejects extensionless `@/*` alias imports at typecheck. `module: ESNext` keeps ESM output (matches `"type": "module"`) and `moduleResolution: Bundler` permits extensionless alias imports; `tsc-alias` rewrites `@/*` → relative in `dist/`. This is the correct pairing for an alias-based ESM project.
  - `"strict": true`, `"esModuleInterop": true`, `"skipLibCheck": true`, `"forceConsistentCasingInFileNames": true`, `"resolveJsonModule": true`
  - `"outDir": "./dist"`, `"rootDir": "./src"`
  - `"baseUrl": "."`, `"paths": { "@/*": ["src/*"] }`
  - `"types": ["node"]`
  - `"include": ["src/**/*"]`, `"exclude": ["node_modules", "dist", "**/*.test.ts"]`
  - Note: with `NodeNext`, `tsc` does not rewrite `@/*` to relative paths. Resolution per context: dev via `tsx` (honors tsconfig paths), tests via Vitest alias (Task 4), build via `tsc-alias` (already chained into `build` in Task 1). All three must map `@/*` → `src/*` identically.
- **Verify:** `pnpm typecheck` exits 0 against an empty `src/` (add a throwaway `src/_tmp.ts` exporting a const if needed, then delete).

### Task 3: Biome config
- **What:** Create `biome.json`.
- **Why:** Replaces ESLint+Prettier; lint/format scripts depend on it.
- **How:** Enable recommended rules, formatter on, organize imports on. Set `files.includes` to `src/**` and root config files. 2-space indent, double quotes, semicolons (match express-starter's prevailing style — semicolons, double quotes). Ignore `dist`, `node_modules`, `coverage`.
- **Verify:** `pnpm lint` exits 0; `pnpm format` is a no-op on already-formatted files.

### Task 4: Vitest config
- **What:** Create `vitest.config.ts`.
- **Why:** Tests must resolve `@/*` aliases and run as ESM.
- **How:** `import { defineConfig } from "vitest/config"` with `resolve.alias` mapping `@` → `path.resolve(__dirname, "src")` (use `fileURLToPath(import.meta.url)` for `__dirname` under ESM). `test.environment: "node"`, `test.globals: true` (so `describe/it/expect` are global, matching the express-starter test style). Include `src/**/*.test.ts`.
- **Verify:** `pnpm test` runs and reports "no tests found" (0 exit) before tests exist.

### Task 5: Husky + lint-staged
- **What:** Configure pre-commit hook.
- **Why:** Enforces the CLAUDE.md pre-commit gate locally.
- **How:** `pnpm exec husky init` creates `.husky/`. Set `.husky/pre-commit` to run `pnpm exec lint-staged`. Add `lint-staged` config to `package.json`: `{ "*.{ts,json}": ["biome check --write"] }`. Note: since the dir is not yet a git repo (`git init` may be needed), document that the hook activates after `git init` + `pnpm install`.
- **Verify:** `.husky/pre-commit` exists and is executable; staging a malformed file and committing triggers Biome.

### Task 6: Ignore files, env example, LICENSE
- **What:** `.gitignore`, `.dockerignore`, `.env.example`, `LICENSE`.
- **Why:** Hygiene + parity; referenced by Docker and env tasks.
- **How:**
  - `.gitignore`: adapt express-starter's but remove `bun-debug.log*` and `logs/` (no file logging); keep `node_modules/`, `dist/`, `.env`, `*.log`, `.DS_Store`, `coverage/`, `*.tsbuildinfo`, editor dirs. Add `pnpm`-relevant nothing special (lockfile IS committed).
  - `.dockerignore`: copy express-starter's; ensure `dist`, `node_modules`, `.git`, `.env`, `*.md`, `coverage` ignored.
  - `.env.example` (mirror SPEC env list):
    ```
    APP_NAME=fastify-starter
    NODE_ENV=development
    LOG_LEVEL=debug
    PORT=3000
    HOST=0.0.0.0
    ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
    RATE_LIMIT_MAX=100
    RATE_LIMIT_WINDOW=60000
    ```
    (Note: `@fastify/rate-limit` uses `max` + `timeWindow` in ms, hence `RATE_LIMIT_WINDOW` in ms.)
  - `LICENSE`: copy `../express-starter/LICENSE` verbatim (check holder/year; keep as-is).
- **Verify:** Files exist; `.env.example` lists exactly the SPEC variables.

---

## Phase 2: Core App (config, constants, utils, types)

**Gate:** `pnpm typecheck` passes with all core modules present.

### Task 7: Constants
- **What:** `src/constants/index.ts`.
- **Why:** Imported by response utils and handlers.
- **How:** Port from express-starter verbatim: `NOT_FOUND_MESSAGE` and `HTTP_STATUS` (`OK, CREATED, BAD_REQUEST, NOT_FOUND, TOO_MANY_REQUESTS, INTERNAL_SERVER_ERROR`) as `as const`.
- **Verify:** `pnpm typecheck` passes.

### Task 8: Env schema
- **What:** `src/config/env.ts`.
- **Why:** Consumed by the `@fastify/env` plugin (Task 11) and decorates `fastify.config`.
- **How:** Import `Type` and `Static` from `@fastify/type-provider-typebox` (**C1** — not `@sinclair/typebox`). Export a TypeBox schema object (`Type.Object`) describing: `NODE_ENV` (`Type.Union` of literals `development|production|test`, default `development`), `PORT` (`Type.Number`, default 3000), `HOST` (string, default `0.0.0.0`), `APP_NAME` (string, default `fastify-starter`), `LOG_LEVEL` (string, default `info`), `ALLOWED_ORIGINS` (string, default `http://localhost:3000,http://localhost:5173`), `RATE_LIMIT_MAX` (`Type.Number`, default 100), `RATE_LIMIT_WINDOW` (`Type.Number` ms, default 60000). Export `Static<typeof EnvSchema>` as `EnvConfig`.
  - **C2 (numeric env coercion):** env vars arrive as strings. `@fastify/env` validates via Ajv with `coerceTypes` and `useDefaults` enabled by default, so `Type.Number()` fields coerce `"3000"` → `3000` and absent fields fall back to defaults. Keep schema field types as real `number`/`string` (not all-string) so coercion applies. Do not set `additionalProperties: false` on the env schema (it would reject unrelated process env keys).
- **Verify:** `pnpm typecheck` passes; `EnvConfig` type resolves with `PORT: number`. (Runtime coercion asserted in Task 11/21 Verify.)

### Task 9: Fastify type augmentation
- **What:** `src/types/fastify.d.ts`.
- **Why:** Makes `fastify.config` typed everywhere.
- **How:** `declare module "fastify"` augmenting `FastifyInstance` with `config: EnvConfig` (import `EnvConfig` from `@/config/env`). Ensure file is picked up by `tsconfig` `include`.
- **Verify:** `pnpm typecheck` passes; `app.config.PORT` is typed `number` in later tasks.

### Task 10: Response helpers
- **What:** `src/utils/response.ts`.
- **Why:** Used by controllers and handlers; defines the `ApiResponse` envelope (parity with express-starter).
- **How:** Port the express-starter shapes but adapt `res: Response` → `reply: FastifyReply`. Keep `ApiResponse<T>` interface (`success, data?, error?, message?, count?, details?`). Functions: `sendResponse(reply, statusCode, body)`, `sendSuccess(reply, data, message?, count?)` (200), `sendCreated(reply, data, message)` (201), `sendError(reply, statusCode, error, message?)`. Use `reply.code(status).send(body)`.
- **Verify:** `pnpm typecheck` passes.

---

## Phase 3: Plugins

**Gate:** `pnpm typecheck` passes; each plugin is a typed Fastify plugin.

### Task 11: Env plugin
- **What:** `src/plugins/env.ts`.
- **Why:** Must register first so `fastify.config` is available to other plugins/routes; gates boot on invalid env.
- **How:** A `fastify-plugin`-wrapped plugin registering `@fastify/env` with `{ schema: EnvSchema, dotenv: true, confKey: "config" }`. Import `EnvSchema` from `@/config/env`. The `fp` wrapper is required so the `config` decorator is visible outside this plugin's encapsulation.
- **Verify:** `pnpm typecheck` passes. Runtime (deferred to Task 21 boot): with no `.env` present, `app.config.PORT === 3000` and `typeof app.config.PORT === "number"` (confirms C2 coercion + defaults).

### Task 12: Sensible plugin
- **What:** `src/plugins/sensible.ts`.
- **Why:** Provides `httpErrors` used by controllers/handlers.
- **How:** `fastify-plugin`-wrapped registration of `@fastify/sensible`.
- **Verify:** `pnpm typecheck` passes.

### Task 13: Security plugin
- **What:** `src/plugins/security.ts`.
- **Why:** Central cors/helmet/compress/rate-limit; depends on `fastify.config` (env plugin).
- **How:** `fastify-plugin`-wrapped. Inside, register:
  - `@fastify/helmet` (defaults).
  - `@fastify/cors`: `origin` = in production split `fastify.config.ALLOWED_ORIGINS` on `,` (filter falsy) else `true` (reflect) — mirror express-starter's prod/dev split; `credentials: true`.
  - `@fastify/compress` (defaults; gzip/br).
  - `@fastify/rate-limit`: `max: fastify.config.RATE_LIMIT_MAX`, `timeWindow: fastify.config.RATE_LIMIT_WINDOW`, `allowList` covering `/health` and `/docs` (use `allowList` function checking `req.url.startsWith`). Read config via the `fastify` instance passed to the plugin.
- **Verify:** `pnpm typecheck` passes.

### Task 14: Under-pressure plugin (health)
- **What:** `src/plugins/under-pressure.ts`.
- **Why:** Owns the `/health` route per SPEC; replaces a custom health handler.
- **How:** `fastify-plugin`-wrapped registration of `@fastify/under-pressure` with `exposeStatusRoute: "/health"` (string form — the object form's types require a `routeOpts` field; string form is simpler and returns `{ status: "ok" }`). Leave pressure thresholds at defaults (no `maxEventLoopDelay`/`maxHeapUsedBytes` overrides for a template). **I4 decision:** the status route returns the lean `{ status: "ok" }` — it intentionally does NOT include the memory stats the express-starter `/health` returned. Note this divergence in the README (Task 25); do not claim a memory payload.
- **Verify:** `pnpm typecheck` passes. (Runtime in Task 21: `GET /health` → 200 `{ status: "ok" }`.)

### Task 15: Swagger plugin (non-prod)
- **What:** `src/plugins/swagger.ts`.
- **Why:** API docs from route schemas; dev/non-prod only per SPEC.
- **How:** `fastify-plugin`-wrapped. If `fastify.config.NODE_ENV !== "production"`, register `@fastify/swagger` (openapi info: title from `APP_NAME`, version `1.0.0`) then `@fastify/swagger-ui` at `routePrefix: "/docs"`. If production, do nothing.
- **Verify:** `pnpm typecheck` passes.

---

## Phase 4: Example Module

**Gate:** `pnpm typecheck` passes; module wired but app not yet assembled.

### Task 16: Example schemas (TypeBox)
- **What:** `src/modules/example/schemas.ts`.
- **Why:** Single source of truth for validation + types; routes and services consume it.
- **How:** Import `Type` and `Static` from `@fastify/type-provider-typebox` (**C1** — single TypeBox source matching the type provider):
  - `ExampleSchema` (id: number, name: string, email: string(format email), age?: number, createdAt: string, updatedAt: string).
  - `CreateExampleBody` (name: string, email: string format email, age?: number).
  - `UpdateExampleBody` = `Type.Partial(CreateExampleBody)`.
  - `ExampleParams` (id: number — use `Type.Number()`; Fastify coerces path param).
  - Response envelope schemas wrapping data in `{ success, data, message?, count? }` for `response` serialization.
  - Export `Static<>` types: `Example`, `ExampleInput`, `ExampleUpdate`.
- **Verify:** `pnpm typecheck` passes.

### Task 17: Example services
- **What:** `src/modules/example/services.ts`.
- **Why:** Business logic; pure + testable (unit tests target this).
- **How:** Port express-starter services verbatim in behavior (in-memory array, `nextId`, `resetExamples`, `getAllExamples`, `getExampleById`→`Example|null`, `createExample`, `updateExample`, `deleteExample`). Use the `Example`/`ExampleInput` types from `schemas.ts` instead of locally-declared interfaces. Keep timestamps as `Date` internally OR as ISO strings — decision: store `Date`, convert to ISO in controller/serialization. To keep schemas simple, store ISO strings (`new Date().toISOString()`) so service output matches `ExampleSchema` directly.
- **Verify:** `pnpm typecheck` passes.

### Task 18: Example controllers
- **What:** `src/modules/example/controllers.ts`.
- **Why:** Thin handlers bridging validated requests → services → response helpers.
- **How:** Async handlers typed via the TypeBox type provider. No manual validation (schema does it). For not-found, `throw fastify.httpErrors.notFound(...)` or return `sendError(reply, HTTP_STATUS.NOT_FOUND, ...)` — choose `sendError` for envelope parity. Handlers: getAll (sendSuccess with count), getById, create (sendCreated), update, delete (sendSuccess message). Access typed `request.body`/`request.params`.
- **Verify:** `pnpm typecheck` passes.

### Task 19: Example routes
- **What:** `src/modules/example/routes.ts`.
- **Why:** Binds schemas to handlers; this is where validation + serialization activate.
- **How:** Export an async Fastify plugin `(fastify) => { ... }` registering 5 routes with `{ schema: { body?, params?, response } }` from `schemas.ts`. Routes: `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`. Handlers imported from controllers. **Execute fix:** `response` schemas cover only success statuses (200/201). Do NOT attach error-status response schemas (400/404) — a strict serializer on error responses causes `FST_ERR_FAILED_ERROR_SERIALIZATION` because the global error handler's envelope is serialized against a schema that doesn't match Fastify's raw error. Error envelopes are guaranteed by the global handler instead.
- **Verify:** `pnpm typecheck` passes.

---

## Phase 5: App Assembly & Entry

**Gate:** `pnpm build` succeeds; `pnpm dev` boots; `/`, `/health`, `/docs`, `/api/example` respond.

### Task 20: buildApp factory
- **What:** `src/app.ts` exporting `buildApp()`.
- **Why:** Central wiring; required by both `server.ts` and integration tests.
- **How:** `export async function buildApp(opts?) { const app = Fastify({ logger: <pino opts>, requestIdHeader: "x-request-id" }).withTypeProvider<TypeBoxTypeProvider>()`.
  - **S2:** Do not set a custom `genReqId` — rely on Fastify's built-in request IDs plus `requestIdHeader: "x-request-id"` (matches the SPEC's "built-in `req.id`" decision). Add `genReqId` only if UUIDs are explicitly wanted later.
  - Logger: pretty transport (`pino-pretty`) when not production, raw JSON otherwise. The toggle reads `process.env.NODE_ENV` directly, because the logger is configured at `Fastify()` construction — *before* the env plugin runs. **I1:** therefore `NODE_ENV` for logging must come from the real process environment (shell / Docker `ENV NODE_ENV=production`), NOT from `.env` (dotenv is loaded later by `@fastify/env`). Document this in the README so a dotenv-only `NODE_ENV=production` does not silently yield pretty logs.
  - Register order: env → sensible → security → under-pressure → swagger, **then `setErrorHandler` + `setNotFoundHandler`, THEN routes**. **Execute fix:** the error/notFound handlers MUST be set before registering the encapsulated route plugins. If routes register first, their child encapsulation context captures Fastify's default error handler and validation errors bypass the custom envelope (returns `{statusCode, code, error, message}` instead of `{success:false,...}`).
  - Register `exampleRoutes` under `{ prefix: "/api/example" }`.
  - Add `GET /` info route (returns APP_NAME, version, endpoints list) via `app.config` (register after env).
  - `app.setErrorHandler` — **I2** explicit precedence:
    1. `if (err.validation)` → status 400, `sendError(reply, 400, "Validation Error", err.message)` with `details: err.validation`.
    2. `else` → `const status = err.statusCode ?? 500`.
    3. Log via `request.log.error` (include `request.id`).
    4. In production, replace the message with a generic string for `status >= 500`; pass through the real message for 4xx.
    5. Emit via `sendError` so the response matches the standard envelope.
  - `app.setNotFoundHandler`: `sendError(reply, 404, "Route not found", NOT_FOUND_MESSAGE)` with a warn log.
  - `await app.ready()` is NOT called here (caller decides). Return `app`.
- **Verify:** `pnpm typecheck` passes; `pnpm build` emits `dist/`.

### Task 21: server.ts entry
- **What:** `src/server.ts`.
- **Why:** Production entry; listen + graceful shutdown.
- **How:** `const app = await buildApp(); await app.ready();` then `app.listen({ port: app.config.PORT, host: app.config.HOST })`. Wire `close-with-grace` (the `close-with-grace` package) calling `await app.close()` with a timeout (e.g., 10000ms), logging signal. Handle listen errors by logging and `process.exit(1)`.
- **Verify:** `pnpm dev` starts; `curl localhost:3000/` returns info JSON; `curl localhost:3000/health` returns ok; `curl localhost:3000/docs` serves UI (dev); `curl -X POST localhost:3000/api/example -H 'content-type: application/json' -d '{"name":"a","email":"a@b.com"}'` returns 201 envelope; invalid body returns 400 envelope.

---

## Phase 6: Tests, Docker, Docs

**Gate:** `pnpm test` green; `pnpm build` green; `pnpm lint` green; Docker image builds.

### Task 22: Service unit tests
- **What:** `src/tests/modules/example.test.ts`.
- **Why:** Parity with express-starter's coverage.
- **How:** Port express-starter's Vitest-compatible tests (they already use `describe/it/expect` globals — enabled via Task 4). `beforeEach(resetExamples)`. Adjust timestamp assertions for ISO-string storage (compare parseable dates / ordering via `Date.parse`). Keep the dynamic `await import("@/modules/example/services")` pattern or switch to top static imports — prefer static imports for clarity.
- **Verify:** `pnpm test` passes all example service cases.

### Task 23: Integration test (app.inject)
- **What:** `src/tests/modules/example.routes.test.ts`.
- **Why:** Demonstrates the buildApp factory + exercises validation/serialization end-to-end.
- **How:** `const app = await buildApp(); await app.ready();` in `beforeAll`; `await app.close()` in `afterAll`; `resetExamples()` in `beforeEach`. Use `app.inject({ method, url, payload })`. Assert: `GET /api/example` → 200 empty list; `POST` valid → 201 + envelope; `POST` missing email → 400; `GET /:id` unknown → 404 envelope; full CRUD round-trip. Set `NODE_ENV=test` (vitest env) so logger is quiet and swagger skipped.
- **Verify:** `pnpm test` passes both files.

### Task 24: Dockerfile + docker-compose
- **What:** `Dockerfile`, `docker-compose.yml`.
- **Why:** Containerization parity, adapted to Node/pnpm multi-stage build.
- **How:**
  - `Dockerfile`: multi-stage. Stage 1 (`node:22-slim` as builder): enable corepack, `pnpm install --frozen-lockfile`, copy source, `pnpm build`. Stage 2 (`node:22-slim`): corepack, `pnpm install --prod --frozen-lockfile`, copy `dist/` from builder, install `curl` for healthcheck, `EXPOSE 3000`, `ENV NODE_ENV=production`, `CMD ["node", "dist/server.js"]`.
  - `docker-compose.yml`: adapt express-starter's; `container_name: fastify-starter`, env vars matching SPEC names (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`), healthcheck curling `/health`.
- **Verify:** `docker build -t fastify-starter .` succeeds; `docker compose up` container reports healthy and serves `/health`. (**Execute note:** Docker was unavailable in the build environment, so the image build was NOT verified live. The Dockerfile is a standard multi-stage Node/pnpm build using `--ignore-scripts` on installs to skip husky.)

### Task 25: README + GitHub Actions CI
- **What:** `README.md`, `.github/workflows/ci.yml`.
- **Why:** Docs + enforced gate on push.
- **How:**
  - `README.md`: overview, stack, prerequisites (Node 22, pnpm via corepack), setup (`pnpm install`, copy `.env.example`), scripts table, project structure, endpoints incl. `/docs`, Docker usage. Include two caveats: (I4) `/health` returns lean `{ status: "ok" }` via under-pressure, not the memory payload the express-starter exposed; (I1) `NODE_ENV` must be set in the real process environment (not just `.env`) for logging mode to be correct.
  - `ci.yml`: trigger on push/PR. Steps: checkout, setup-node@v4 (node 22, cache pnpm), `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- **Verify:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass locally (mirrors CI). README renders; endpoints listed match implementation.

---

## Final Verification (pre-commit gate)

Run in order, fix any failure before committing:
1. `pnpm install --frozen-lockfile`
2. `pnpm build`
3. `pnpm test`
4. `pnpm typecheck && pnpm lint`

Commit (feature-scoped, e.g. `chore: scaffold fastify-starter template`) only when all pass.
