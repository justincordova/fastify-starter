import { EnvSchema } from "@/config/env";
import fastifyEnv from "@fastify/env";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

/**
 * Registers @fastify/env to validate process.env against EnvSchema at boot and
 * decorate the instance with a typed `config`. Wrapped with fastify-plugin so
 * the `config` decorator escapes this plugin's encapsulation context.
 */
export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(fastifyEnv, {
      schema: EnvSchema,
      dotenv: true,
      confKey: "config",
    });
  },
  { name: "env" },
);
