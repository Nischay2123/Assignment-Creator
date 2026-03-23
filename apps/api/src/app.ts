import cors from "cors";
import express from "express";
import { logger } from "@repo/logger";

import { errorHandler } from "./common/middleware/error-handler.js";
import { userRoutes } from "./modules/user/user.routes.js";

export const createApp = () => {
  const app = express();

  const corsOptions = {
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };

  app.use(cors(corsOptions as cors.CorsOptions));
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
