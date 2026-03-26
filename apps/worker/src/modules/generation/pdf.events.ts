import type { PdfGenerationSocketEvent } from "../../common/types/generation.types.js";
import { redisManager } from "../../config/redis.js";
import { PDF_GENERATION_NOTIFICATIONS_CHANNEL } from "./generation.constants.js";

export const publishPdfGenerationEvent = async (event: PdfGenerationSocketEvent) => {
  await redisManager.getPublisher().publish(
    PDF_GENERATION_NOTIFICATIONS_CHANNEL,
    JSON.stringify(event)
  );
};
