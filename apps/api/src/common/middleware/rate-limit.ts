import rateLimit, { Options } from "express-rate-limit";
import { Request, Response } from "express";
import { rateLimitStore } from "./rate-limit-store.js";

/**
 * Configuration for rate limiting
 * Window: 1 minute
 * Limit: 100 requests per minute
 */
const DEFAULT_RATE_LIMIT_CONFIG = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: rateLimitStore,
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoint
    return req.path === "/health";
  },
};

/**
 * Creates a rate limiter middleware with smart key generation
 * Key strategy: Use user ID if authenticated, fall back to IP address
 *
 * @param options Optional configuration to override defaults
 * @returns Express rate limit middleware
 */
export function createRateLimiter(options?: Partial<Options>) {
  const config = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
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
export const globalRateLimiter = createRateLimiter();

/**
 * Auth endpoints rate limiter
 * Stricter limit to prevent brute force attacks
 * Limit: 5 requests per 15 minutes per IP/user
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
});

/**
 * Resource-intensive endpoints rate limiter
 * Very strict limit for heavy operations
 * Limit: 10 requests per 24 hours per user
 */
export const resourceIntensiveRateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 requests per window
});
