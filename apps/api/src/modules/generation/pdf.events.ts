import { logger } from "@repo/logger";
import type { Server as SocketIOServer } from "socket.io";

import type { PdfGenerationSocketEvent } from "../../common/types/generation.types.js";
import { redisManager } from "../../config/redis.js";
import {
  PDF_GENERATION_NOTIFICATIONS_CHANNEL,
  PDF_GENERATION_SOCKET_EVENT
} from "./generation.constants.js";

const pdfEventsLogger = logger.child({ module: "pdf-events" });

export const publishPdfGenerationEvent = async (event: PdfGenerationSocketEvent) => {
  await redisManager.getPublisher().publish(
    PDF_GENERATION_NOTIFICATIONS_CHANNEL,
    JSON.stringify(event)
  );
};

export const startPdfGenerationEventBridge = async (io: SocketIOServer) => {
  const subscriber = redisManager.getSubscriber();

  await subscriber.subscribe(PDF_GENERATION_NOTIFICATIONS_CHANNEL);

  subscriber.on("message", (channel: string, payload: string) => {
    if (channel !== PDF_GENERATION_NOTIFICATIONS_CHANNEL) {
      return;
    }

    try {
      const event = JSON.parse(payload) as PdfGenerationSocketEvent;
      io.emit(PDF_GENERATION_SOCKET_EVENT, event);
    } catch (error) {
      pdfEventsLogger.error("Failed to parse PDF generation notification", {
        error: error instanceof Error ? error.message : "Unknown error",
        payload
      });
    }
  });

  pdfEventsLogger.info("PDF generation event bridge started");
};
