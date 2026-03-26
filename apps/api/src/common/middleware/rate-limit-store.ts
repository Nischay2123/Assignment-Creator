import RedisStore from "rate-limit-redis";
import { redisManager } from "../../config/redis.js";

/**
 * Rate limit store using Redis with sliding window counter strategy
 * This store is used by express-rate-limit middleware to track and enforce rate limits
 */
export const rateLimitStore = new (RedisStore as any)({
  client: redisManager.getRateLimitClient(),
  prefix: "rate-limit:",
  // Sliding window counter implementation
  // Each request increments a counter in a specific time window
  sendUnknownCommands: false,
});
