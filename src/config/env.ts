import { type Static, Type } from "@fastify/type-provider-typebox";

/**
 * Environment variable schema.
 *
 * Consumed by the @fastify/env plugin, which validates process.env at boot via
 * Ajv. Ajv runs with `coerceTypes` and `useDefaults` enabled, so numeric env
 * strings (e.g. "3000") are coerced to numbers and absent values fall back to
 * the defaults below. Do not set `additionalProperties: false` here — that
 * would reject the many unrelated keys present in process.env.
 */
export const EnvSchema = Type.Object({
  NODE_ENV: Type.Union(
    [Type.Literal("development"), Type.Literal("production"), Type.Literal("test")],
    { default: "development" },
  ),
  PORT: Type.Number({ default: 3000 }),
  HOST: Type.String({ default: "0.0.0.0" }),
  APP_NAME: Type.String({ default: "fastify-starter" }),
  LOG_LEVEL: Type.String({ default: "info" }),
  ALLOWED_ORIGINS: Type.String({
    default: "http://localhost:3000,http://localhost:5173",
  }),
  RATE_LIMIT_MAX: Type.Number({ default: 100 }),
  RATE_LIMIT_WINDOW: Type.Number({ default: 60000 }),
});

export type EnvConfig = Static<typeof EnvSchema>;
