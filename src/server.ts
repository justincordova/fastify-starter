import closeWithGrace from "close-with-grace";
import type { FastifyInstance } from "fastify";
import { buildApp } from "@/app";

const SHUTDOWN_TIMEOUT = 10_000;

const start = async (): Promise<void> => {
  let app: FastifyInstance | undefined;

  try {
    app = await buildApp();
    await app.ready();
    await app.listen({ port: app.config.PORT, host: app.config.HOST });
  } catch (err) {
    if (app) {
      app.log.error(err, "Failed to start server");
    } else {
      console.error("Failed to initialize server", err);
    }
    process.exitCode = 1;
    return;
  }

  closeWithGrace({ delay: SHUTDOWN_TIMEOUT }, async ({ signal, err }) => {
    if (err) {
      app.log.error(err, "Error during shutdown");
    } else {
      app.log.info(`Received ${signal}, shutting down gracefully`);
    }
    await app.close();
  });
};

void start();
