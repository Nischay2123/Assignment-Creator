import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/assignment-creator"),
  REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export const env = envSchema.parse(process.env);
