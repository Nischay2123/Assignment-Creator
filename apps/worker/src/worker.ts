import { logger } from "@repo/logger";
import { Worker } from "bullmq";

import type { FileProcessingJobData } from "./common/types/file-processing.types.js";
import type { GenerationJobData } from "./common/types/generation.types.js";
import { connectDatabase } from "./config/db.js";
import { redisManager } from "./config/redis.js";
import {
  FILE_PROCESSING_JOB_NAME,
  FILE_PROCESSING_QUEUE_NAME
} from "./modules/assignment/file.constants.js";
import { FileProcessor } from "./modules/assignment/file.processor.js";
import {
  GENERATION_JOB_NAME,
  GENERATION_QUEUE_NAME
} from "./modules/generation/generation.constants.js";
import { GenerationProcessor } from "./modules/generation/generation.processor.js";

const workerLogger = logger.child({ module: "generation-worker" });
const generationProcessor = new GenerationProcessor();
const fileProcessor = new FileProcessor();

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

  const fileProcessingWorker = new Worker<
    FileProcessingJobData,
    void,
    typeof FILE_PROCESSING_JOB_NAME
  >(
    FILE_PROCESSING_QUEUE_NAME,
    async (job) => {
      await fileProcessor.processJob(job.data);
    },
    {
      connection: redisManager.getConnectionOptions("queue"),
      concurrency: 1
    }
  );

  fileProcessingWorker.on("completed", (job) => {
    workerLogger.info("File processing job completed", {
      jobId: job.id,
      assignmentId: job.data.assignmentId,
      fileUrl: job.data.fileUrl
    });
  });

  fileProcessingWorker.on("failed", (job, error) => {
    workerLogger.error("File processing job failed", {
      jobId: job?.id,
      assignmentId: job?.data.assignmentId,
      fileUrl: job?.data.fileUrl,
      error: error.message
    });
  });

  workerLogger.info("File processing worker started", {
    queueName: FILE_PROCESSING_QUEUE_NAME
  });
};

bootstrap().catch((error: unknown) => {
  workerLogger.error("Failed to start generation worker", {
    error: error instanceof Error ? error.message : "Unknown error"
  });
  process.exit(1);
});
