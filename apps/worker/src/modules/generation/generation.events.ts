import type { GenerationSocketEvent } from "../../common/types/generation.types.js";
import { redisManager } from "../../config/redis.js";
import { GENERATION_NOTIFICATIONS_CHANNEL } from "./generation.constants.js";

export const publishGenerationEvent = async (event: GenerationSocketEvent) => {
  await redisManager.getPublisher().publish(
    GENERATION_NOTIFICATIONS_CHANNEL,
    JSON.stringify(event)
  );
};
