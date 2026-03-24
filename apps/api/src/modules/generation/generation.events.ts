import { logger } from "@repo/logger";
import type { Server as SocketIOServer } from "socket.io";

import type { GenerationSocketEvent } from "../../common/types/generation.types.js";
import { redisManager } from "../../config/redis.js";
import {
  GENERATION_NOTIFICATIONS_CHANNEL,
  GENERATION_SOCKET_EVENT
} from "./generation.constants.js";

const generationEventsLogger = logger.child({ module: "generation-events" });

export const publishGenerationEvent = async (event: GenerationSocketEvent) => {
  await redisManager.getPublisher().publish(
    GENERATION_NOTIFICATIONS_CHANNEL,
    JSON.stringify(event)
  );
};

export const startGenerationEventBridge = async (io: SocketIOServer) => {
  const subscriber = redisManager.getSubscriber();

  await subscriber.subscribe(GENERATION_NOTIFICATIONS_CHANNEL);

  subscriber.on("message", (channel: string, payload: string) => {
    if (channel !== GENERATION_NOTIFICATIONS_CHANNEL) {
      return;
    }

    try {
      const event = JSON.parse(payload) as GenerationSocketEvent;
      io.emit(GENERATION_SOCKET_EVENT, event);
    } catch (error) {
      generationEventsLogger.error("Failed to parse generation notification", {
        error: error instanceof Error ? error.message : "Unknown error",
        payload
      });
    }
  });

  return subscriber;
};
