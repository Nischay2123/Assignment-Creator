import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/assignment-creator"),
  REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),
  ACCESS_TOKEN_SECRET: z.string().min(1).default("change-me"),
  ACCESS_TOKEN_EXPIRY: z.string().min(1).default("1d"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().min(1).default("Assignment Creator"),
  SMTP_FROM_EMAIL: z.string().email().default("no-reply@assignment-creator.local")
});

export const env = envSchema.parse(process.env);
