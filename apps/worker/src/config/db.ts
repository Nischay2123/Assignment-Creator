import { createMongoConnectionManager } from "@repo/infrastructure";

import { env } from "./env.js";

export const mongoConnectionManager = createMongoConnectionManager({
  uri: env.MONGODB_URI,
  name: "worker-mongo-manager"
});

export const connectDatabase = () => mongoConnectionManager.connect();
