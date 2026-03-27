import rateLimit, { Options } from "express-rate-limit";
import { Request, Response } from "express";
import { DynamicRateLimitStore } from "./rate-limit-store.js";

/**
 * Helper function to create a rate limiter middleware with smart key generation
 * Key strategy: Use user ID if authenticated, fall back to IP address
 *
 * @param windowMs Time window in milliseconds
 * @param max Maximum requests per window
 * @param options Optional configuration to override defaults
 * @returns Express rate limit middleware
 */
function createLimiter(
  windowMs: number,
  max: number,
  prefix: string,
  options?: Partial<Options>
) {
  const store = new DynamicRateLimitStore(prefix);

  const config = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    keyGenerator: (req: Request, _res: Response) => {
      // Try to get user ID from authenticated user (set by authenticateJwt middleware)
      const userId = (req as any).user?.id;

      if (userId) {
        // Use user ID for authenticated requests
        return `user:${userId}`;
      }

      // Fall back to IP address for unauthenticated requests
      let ip = "unknown";
      const forwardedFor = req.headers["x-forwarded-for"];

      if (typeof forwardedFor === "string") {
        const firstIp = forwardedFor.split(",")[0];
        if (firstIp) {
          ip = firstIp.trim();
        }
      } else if (req.socket.remoteAddress) {
        ip = req.socket.remoteAddress;
      }

      return `ip:${ip}`;
    },
    skip: (req: Request) => {
      // Skip rate limiting for health check endpoint
      return req.path === "/health";
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        error: "Too Many Requests",
        message: "You have exceeded the rate limit. Please try again later.",
        retryAfter: res.getHeader("Retry-After"),
      });
    },
    ...options,
  };

  return rateLimit(config as Options);
}

/**
 * Global rate limiter middleware instance
 * Applied to all routes except health check
 * Limit: 100 requests per minute
 */
export const globalRateLimiter = createLimiter(
  1 * 60 * 1000, // 1 minute
  100, // 100 requests
  "rl:global:"
);

/**
 * Auth endpoints rate limiter
 * Stricter limit to prevent brute force attacks
 * Limit: 5 requests per 15 minutes per IP/user
 */
export const authRateLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  "rl:auth:"
);

/**
 * Resource-intensive endpoints rate limiter
 * Very strict limit for heavy operations
 * Limit: 10 requests per 24 hours per user
 */
export const resourceIntensiveRateLimiter = createLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  10, // 10 requests
  "rl:resource:"
);
