import { logger } from "@repo/logger";
import { Worker } from "bullmq";

import type { GenerationJobData } from "./common/types/generation.types.js";
import { connectDatabase } from "./config/db.js";
import { redisManager } from "./config/redis.js";
import {
  GENERATION_JOB_NAME,
  GENERATION_QUEUE_NAME
} from "./modules/generation/generation.constants.js";
import { GenerationProcessor } from "./modules/generation/generation.processor.js";

const workerLogger = logger.child({ module: "generation-worker" });
const generationProcessor = new GenerationProcessor();

const bootstrap = async () => {
  await connectDatabase();

  const worker = new Worker<GenerationJobData, void, typeof GENERATION_JOB_NAME>(
    GENERATION_QUEUE_NAME,
    async (job) => {
      await generationProcessor.processJob(job.data);
    },
    {
      connection: redisManager.getConnectionOptions("queue"),
      concurrency: 1
    }
  );

  worker.on("completed", (job) => {
    workerLogger.info("Generation job completed", {
      jobId: job.id,
      assignmentId: job.data.assignmentId,
      generationId: job.data.generationId
    });
  });

  worker.on("failed", (job, error) => {
    workerLogger.error("Generation job failed", {
      jobId: job?.id,
      assignmentId: job?.data.assignmentId,
      generationId: job?.data.generationId,
      error: error.message
    });
  });

  workerLogger.info("Generation worker started", {
    queueName: GENERATION_QUEUE_NAME
  });
};

bootstrap().catch((error: unknown) => {
  workerLogger.error("Failed to start generation worker", {
    error: error instanceof Error ? error.message : "Unknown error"
  });
  process.exit(1);
});
