import mongoose from "mongoose";
import { logger } from "@repo/logger";

import { env } from "./env.js";

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    logger.debug("MongoDB connection already established");
    return mongoose.connection;
  }

  const connection = await mongoose.connect(env.MONGODB_URI);

  logger.info("MongoDB connected", {
    host: connection.connection.host,
    name: connection.connection.name
  });

  return connection;
};
