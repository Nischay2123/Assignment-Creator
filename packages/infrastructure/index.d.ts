import type { Redis, RedisOptions } from "ioredis";
import type mongoose from "mongoose";

export interface MongoConnectionManager {
  connect(): Promise<typeof mongoose.connection>;
  disconnect(): Promise<void>;
  getConnection(): typeof mongoose.connection;
}

export interface RedisProfileConfig {
  clientOptions?: Partial<RedisOptions>;
  connectionOptions?: Partial<RedisOptions>;
}

export interface RedisConnectionOptions extends Partial<RedisOptions> {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  maxRetriesPerRequest: null;
}

export interface RedisManager {
  getClient(profileName?: string): Redis;
  getPublisher(): Redis;
  getSubscriber(): Redis;
  getQueueClient(): Redis;
  getCacheClient(): Redis;
  getRateLimitClient(): Redis;
  getConnectionOptions(profileName?: string): RedisConnectionOptions;
  disconnectAll(): Promise<void>;
}

export function createMongoConnectionManager(config: {
  uri: string;
  name?: string;
}): MongoConnectionManager;

export function createRedisManager(config: {
  url: string;
  name?: string;
  profiles?: Record<string, RedisProfileConfig>;
}): RedisManager;
