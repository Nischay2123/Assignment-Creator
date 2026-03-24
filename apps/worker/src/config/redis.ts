import { createRedisManager } from "@repo/infrastructure";

import { env } from "./env.js";

export const redisManager = createRedisManager({
  url: env.REDIS_URL,
  name: "worker-redis-manager",
  profiles: {
    queue: {
      clientOptions: {
        enableOfflineQueue: false,
        maxRetriesPerRequest: null,
        retryStrategy(times) {
          return Math.min(times * 100, 3000);
        }
      },
      connectionOptions: {
        enableOfflineQueue: false,
        maxRetriesPerRequest: null
      }
    },
    publisher: {
      clientOptions: {
        enableOfflineQueue: true,
        maxRetriesPerRequest: 1
      }
    },
    subscriber: {
      clientOptions: {
        enableOfflineQueue: true,
        maxRetriesPerRequest: null,
        retryStrategy(times) {
          return Math.min(times * 100, 3000);
        }
      }
    },
    cache: {
      clientOptions: {
        enableOfflineQueue: true,
        maxRetriesPerRequest: 2
      }
    },
    rateLimit: {
      clientOptions: {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          return Math.min(times * 25, 500);
        }
      }
    }
  }
});
