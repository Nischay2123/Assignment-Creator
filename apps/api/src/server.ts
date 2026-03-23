import { logger } from "@repo/logger";

import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const bootstrap = async () => {
  await connectDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info("API server listening", {
      url: `http://localhost:${env.PORT}`,
      port: env.PORT
    });
  });
};

bootstrap().catch((error: unknown) => {
  logger.error("Failed to start API server", {
    error: error instanceof Error ? error.message : "Unknown error"
  });
  process.exit(1);
});
