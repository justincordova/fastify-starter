import fastifyCompress from "@fastify/compress";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

/**
 * Registers the security middleware stack: helmet, cors, compression, and
 * rate limiting. Depends on `fastify.config` (the env plugin must be
 * registered first).
 */
export default fp(
  async (fastify: FastifyInstance) => {
    const { NODE_ENV, ALLOWED_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } = fastify.config;

    await fastify.register(fastifyHelmet);

    await fastify.register(fastifyCors, {
      origin:
        NODE_ENV === "production"
          ? ALLOWED_ORIGINS.split(",")
              .map((origin) => origin.trim())
              .filter(Boolean)
          : true,
      credentials: true,
    });

    await fastify.register(fastifyCompress);

    await fastify.register(fastifyRateLimit, {
      max: RATE_LIMIT_MAX,
      timeWindow: RATE_LIMIT_WINDOW,
      allowList: (req: FastifyRequest) =>
        req.url.startsWith("/health") || req.url.startsWith("/docs"),
    });
  },
  { name: "security", dependencies: ["env"] },
);
