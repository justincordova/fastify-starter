import fastifyUnderPressure from "@fastify/under-pressure";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

/**
 * Registers @fastify/under-pressure for load-based health checks and automatic
 * 503 shedding under memory / event-loop pressure. Owns the `/health` route,
 * which returns a lean `{ status: "ok" }` (intentionally without memory stats).
 */
export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(fastifyUnderPressure, {
      exposeStatusRoute: "/health",
    });
  },
  { name: "under-pressure" },
);
