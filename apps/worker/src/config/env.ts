import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/assignment-creator"),
  REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash-lite"),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000)
});

export const env = envSchema.parse(process.env);
