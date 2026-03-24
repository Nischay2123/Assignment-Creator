import { Queue } from "bullmq";

import { redisManager } from "../../config/redis.js";
import type { GenerationJobData } from "../../common/types/generation.types.js";
import {
  GENERATION_JOB_NAME,
  GENERATION_QUEUE_NAME
} from "./generation.constants.js";

export const generationQueue = new Queue<
  GenerationJobData,
  void,
  typeof GENERATION_JOB_NAME
>(GENERATION_QUEUE_NAME, {
  connection: redisManager.getConnectionOptions("queue"),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

export const addGenerationJob = (data: GenerationJobData) =>
  generationQueue.add(GENERATION_JOB_NAME, data);
