
import { MemoryStore } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import type { Redis } from "ioredis";


export class DynamicRateLimitStore {
  private prefix: string;
  private memoryStore: MemoryStore;
  private redisStore: RedisStore | null = null;
  private options: any = null;
  private current: MemoryStore | RedisStore;

  constructor(prefix: string = "rl:") {
    this.prefix = prefix;
    this.memoryStore = new MemoryStore();
    this.current = this.memoryStore;
  }

  /**
   * Initialize the store with options
   */
  init(options: any): void {
    this.options = options;
    this.memoryStore.init(options);
  }

  /**
   * Switch to Redis store when available
   */
  async initRedis(redis: Redis): Promise<void> {
    try {
      this.redisStore = new RedisStore({
        sendCommand: (cmd: string, ...args: (string | number)[]): Promise<any> => {
          return redis.call(cmd, ...args) as Promise<any>;
        },
        prefix: this.prefix,
        resetExpiryOnChange: true,
      });

      if (this.options) {
        this.redisStore.init(this.options);
      }

      this.current = this.redisStore;
      console.log(`[RateLimit] Switched to Redis store (${this.prefix})`);
    } catch (err) {
      console.warn(
        `[RateLimit] Redis init failed (${this.prefix}):`,
        (err as Error).message
      );
      this.fallbackToMemory();
    }
  }

  /**
   * Fallback to memory store
   */
  private fallbackToMemory(): void {
    this.current = this.memoryStore;
    console.warn(`[RateLimit] Falling back to memory (${this.prefix})`);
  }

  /**
   * Proxy methods to current store
   */
  increment(key: string): any {
    return this.current.increment(key);
  }

  decrement(key: string): any {
    return this.current.decrement(key);
  }

  resetKey(key: string): any {
    return this.current.resetKey(key);
  }
}