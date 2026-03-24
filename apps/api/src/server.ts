import { createServer } from "http";
import { logger } from "@repo/logger";

import { createSocketServer } from "./common/socket/socket-server.js";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { startGenerationEventBridge } from "./modules/generation/generation.events.js";

const bootstrap = async () => {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);
  await startGenerationEventBridge(io);

  httpServer.listen(env.PORT, () => {
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
