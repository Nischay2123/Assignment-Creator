import { Queue } from "bullmq";

import type { PdfGenerationJobData } from "../../common/types/generation.types.js";
import { redisManager } from "../../config/redis.js";
import {
  PDF_GENERATION_JOB_NAME,
  PDF_GENERATION_QUEUE_NAME
} from "./generation.constants.js";

export const pdfGenerationQueue = new Queue<
  PdfGenerationJobData,
  void,
  typeof PDF_GENERATION_JOB_NAME
>(PDF_GENERATION_QUEUE_NAME, {
  connection: redisManager.getConnectionOptions("queue"),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

export const addPdfGenerationJob = (data: PdfGenerationJobData) =>
  pdfGenerationQueue.add(PDF_GENERATION_JOB_NAME, data);
