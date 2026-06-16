import fastifySensible from "@fastify/sensible";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

/**
 * Registers @fastify/sensible, which adds ergonomic helpers such as
 * `reply.notFound()` and `fastify.httpErrors.*`. Wrapped with fastify-plugin
 * so the decorators are available application-wide.
 */
export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(fastifySensible);
  },
  { name: "sensible" },
);
