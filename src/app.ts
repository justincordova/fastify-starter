import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import { HTTP_STATUS, NOT_FOUND_MESSAGE } from "@/constants";
import exampleRoutes from "@/modules/example/routes";
import envPlugin from "@/plugins/env";
import securityPlugin from "@/plugins/security";
import sensiblePlugin from "@/plugins/sensible";
import swaggerPlugin from "@/plugins/swagger";
import underPressurePlugin from "@/plugins/under-pressure";
import { sendError } from "@/utils/response";

/**
 * Build and configure the Fastify application.
 *
 * Returns a configured instance WITHOUT calling `listen` — the caller decides
 * when to listen (server.ts) or inject (tests). The logger mode is derived from
 * `process.env.NODE_ENV` at construction time, because the env plugin (which
 * populates `fastify.config`) has not run yet. NODE_ENV must therefore come
 * from the real process environment, not from `.env`.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const isProduction = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";

  const app = Fastify({
    logger: isTest
      ? false
      : {
          level: process.env.LOG_LEVEL ?? "info",
          transport: isProduction ? undefined : { target: "pino-pretty" },
        },
    requestIdHeader: "x-request-id",
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Plugins (order matters: env first so config is available downstream)
  await app.register(envPlugin);
  await app.register(sensiblePlugin);
  await app.register(securityPlugin);
  await app.register(underPressurePlugin);
  await app.register(swaggerPlugin);

  // Global error handler
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error.validation) {
      request.log.warn({ requestId: request.id, err: error }, "Validation error");
      sendError(
        reply,
        HTTP_STATUS.BAD_REQUEST,
        "Validation Error",
        error.message,
        error.validation,
      );
      return;
    }

    const statusCode = error.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;

    request.log.error({ requestId: request.id, err: error }, "Unhandled error occurred");

    const message =
      isProduction && statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR
        ? "Something went wrong on our end"
        : error.message;

    sendError(reply, statusCode, "Internal Server Error", message);
  });

  // 404 handler
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    request.log.warn(
      { requestId: request.id, url: request.url, method: request.method },
      "Route not found",
    );
    sendError(reply, HTTP_STATUS.NOT_FOUND, "Route not found", NOT_FOUND_MESSAGE);
  });

  // Root route - API info and available endpoints
  app.get("/", async () => {
    return {
      message: `${app.config.APP_NAME} Server`,
      version: "1.0.0",
      endpoints: {
        health: "/health",
        docs: "/docs",
        api: "/api/example",
      },
    };
  });

  // Feature routes
  await app.register(exampleRoutes, { prefix: "/api/example" });

  return app;
}
