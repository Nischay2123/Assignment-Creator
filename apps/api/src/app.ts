import cors from "cors";
import express from "express";
import { logger } from "@repo/logger";

import { errorHandler } from "./common/middleware/error-handler.js";
import { userRoutes } from "./modules/user/user.routes.js";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", () => {
      logger.info("HTTP request completed", {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt
      });
    });

    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/users", userRoutes);
  app.use(errorHandler);

  return app;
};
