import { Queue } from "bullmq";

import type { FileProcessingJobData } from "../../common/types/file-processing.types.js";
import { redisManager } from "../../config/redis.js";
import { FILE_PROCESSING_JOB_NAME, FILE_PROCESSING_QUEUE_NAME } from "./file.constants.js";

export const fileProcessingQueue = new Queue<
  FileProcessingJobData,
  void,
  typeof FILE_PROCESSING_JOB_NAME
>(FILE_PROCESSING_QUEUE_NAME, {
  connection: redisManager.getConnectionOptions("queue"),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

export const addFileProcessingJob = (data: FileProcessingJobData) =>
  fileProcessingQueue.add(FILE_PROCESSING_JOB_NAME, data);
