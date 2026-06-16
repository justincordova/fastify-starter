import { buildApp } from "@/app";
import closeWithGrace from "close-with-grace";

const SHUTDOWN_TIMEOUT = 10_000;

const start = async (): Promise<void> => {
  const app = await buildApp();

  try {
    await app.ready();
    await app.listen({ port: app.config.PORT, host: app.config.HOST });
  } catch (err) {
    app.log.error(err, "Failed to start server");
    process.exit(1);
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

start();
