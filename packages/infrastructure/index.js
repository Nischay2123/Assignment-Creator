import { logger } from "@repo/logger";
import { Redis } from "ioredis";
import mongoose from "mongoose";

const DEFAULT_REDIS_PROFILE_NAMES = {
  default: "default",
  queue: "queue",
  publisher: "publisher",
  subscriber: "subscriber",
  cache: "cache",
  rateLimit: "rateLimit"
};

const buildRedisConnectionOptions = (redisUrl) => {
  const parsedUrl = new URL(redisUrl);

  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 6379),
    username: parsedUrl.username || undefined,
    password: parsedUrl.password || undefined,
    db: parsedUrl.pathname ? Number(parsedUrl.pathname.slice(1) || 0) : 0,
    maxRetriesPerRequest: null
  };
};

export const createMongoConnectionManager = ({
  uri,
  name = "mongo-manager"
}) => {
  const mongoLogger = logger.child({ module: name });

  return {
    async connect() {
      if (mongoose.connection.readyState === 1) {
        mongoLogger.debug("MongoDB connection already established");
        return mongoose.connection;
      }

      const connection = await mongoose.connect(uri);

      mongoLogger.info("MongoDB connected", {
        host: connection.connection.host,
        name: connection.connection.name
      });

      return connection;
    },
    async disconnect() {
      if (mongoose.connection.readyState === 0) {
        return;
      }

      await mongoose.disconnect();
      mongoLogger.info("MongoDB disconnected");
    },
    getConnection() {
      return mongoose.connection;
    }
  };
};

const mergeRedisOptions = (baseOptions, overrideOptions = {}) => {
  return {
    ...baseOptions,
    ...overrideOptions
  };
};

const buildRedisProfiles = (baseConnectionOptions, profiles = {}) => {
  const normalizedProfiles = {
    [DEFAULT_REDIS_PROFILE_NAMES.default]: {}
  };

  for (const [profileName, profileConfig] of Object.entries(profiles)) {
    normalizedProfiles[profileName] = profileConfig ?? {};
  }

  for (const profileName of Object.values(DEFAULT_REDIS_PROFILE_NAMES)) {
    normalizedProfiles[profileName] = normalizedProfiles[profileName] ?? {};
  }

  return Object.fromEntries(
    Object.entries(normalizedProfiles).map(([profileName, profileConfig]) => {
      const normalizedProfile = profileConfig ?? {};

      return [
        profileName,
        {
          clientOptions: mergeRedisOptions(
            baseConnectionOptions,
            normalizedProfile.clientOptions
          ),
          connectionOptions: mergeRedisOptions(
            baseConnectionOptions,
            normalizedProfile.connectionOptions
          )
        }
      ];
    })
  );
};

export const createRedisManager = ({
  url,
  name = "redis-manager",
  profiles = {}
}) => {
  const redisLogger = logger.child({ module: name });
  const clients = new Map();
  const baseConnectionOptions = buildRedisConnectionOptions(url);
  const resolvedProfiles = buildRedisProfiles(baseConnectionOptions, profiles);

  const getProfile = (profileName = DEFAULT_REDIS_PROFILE_NAMES.default) => {
    const profile = resolvedProfiles[profileName];

    if (!profile) {
      throw new Error(`Unknown Redis profile: ${profileName}`);
    }

    return profile;
  };

  const getClient = (profileName = DEFAULT_REDIS_PROFILE_NAMES.default) => {
    const existingClient = clients.get(profileName);

    if (existingClient) {
      return existingClient;
    }

    const profile = getProfile(profileName);
    const client = new Redis(url, profile.clientOptions);

    client.on("error", (error) => {
      redisLogger.error("Redis client error", {
        profileName,
        error: error.message
      });
    });

    clients.set(profileName, client);

    return client;
  };

  return {
    getClient,
    getPublisher() {
      return getClient(DEFAULT_REDIS_PROFILE_NAMES.publisher);
    },
    getSubscriber() {
      return getClient(DEFAULT_REDIS_PROFILE_NAMES.subscriber);
    },
    getQueueClient() {
      return getClient(DEFAULT_REDIS_PROFILE_NAMES.queue);
    },
    getCacheClient() {
      return getClient(DEFAULT_REDIS_PROFILE_NAMES.cache);
    },
    getRateLimitClient() {
      return getClient(DEFAULT_REDIS_PROFILE_NAMES.rateLimit);
    },
    getConnectionOptions(profileName = DEFAULT_REDIS_PROFILE_NAMES.default) {
      return getProfile(profileName).connectionOptions;
    },
    async disconnectAll() {
      const activeClients = [...clients.values()];
      clients.clear();
      await Promise.all(activeClients.map((client) => client.quit()));
      redisLogger.info("Redis clients disconnected", {
        clients: activeClients.length
      });
    }
  };
};
