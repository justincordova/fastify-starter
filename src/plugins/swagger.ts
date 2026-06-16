import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

/**
 * Registers OpenAPI documentation generated from route schemas, served via
 * Swagger UI at `/docs`. Only active outside production. Depends on
 * `fastify.config` (the env plugin must be registered first).
 */
export default fp(
  async (fastify: FastifyInstance) => {
    if (fastify.config.NODE_ENV === "production") {
      return;
    }

    await fastify.register(fastifySwagger, {
      openapi: {
        openapi: "3.0.0",
        info: {
          title: fastify.config.APP_NAME,
          description: `${fastify.config.APP_NAME} API documentation`,
          version: "1.0.0",
        },
      },
    });

    await fastify.register(fastifySwaggerUi, {
      routePrefix: "/docs",
    });
  },
  { name: "swagger", dependencies: ["env"] },
);
