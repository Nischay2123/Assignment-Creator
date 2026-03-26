import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { logger } from "@repo/logger";

import { env } from "../../config/env.js";
import { ASSIGNMENT_SOURCE_FILE_KEY_PREFIX } from "./file.constants.js";

const assignmentFileLogger = logger.child({ module: "worker-assignment-file-service" });

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

const getAssignmentSourceKey = (assignmentId: string): string => {
  return `${ASSIGNMENT_SOURCE_FILE_KEY_PREFIX}/${assignmentId}/source`;
};

const getAssignmentPdfKey = (assignmentId: string, generationId: string): string => {
  return `${ASSIGNMENT_SOURCE_FILE_KEY_PREFIX}/${assignmentId}/pdf/${generationId}.pdf`;
};

const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

export const uploadAssignmentSourceFile = async (
  assignmentId: string,
  buffer: Buffer,
  contentType: string
): Promise<{ fileUrl: string }> => {
  const key = getAssignmentSourceKey(assignmentId);

  assignmentFileLogger.info("Assignment source upload started", {
    assignmentId,
    key,
    contentType,
    sizeBytes: buffer.length
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );

  const fileUrl = `s3://${env.AWS_S3_BUCKET}/${key}`;

  assignmentFileLogger.info("Assignment source upload completed", {
    assignmentId,
    key,
    fileUrl
  });

  return { fileUrl };
};

export const downloadAssignmentSourceFile = async (
  assignmentId: string
): Promise<{ fileUrl: string; buffer: Buffer }> => {
  const key = getAssignmentSourceKey(assignmentId);
  const fileUrl = `s3://${env.AWS_S3_BUCKET}/${key}`;

  assignmentFileLogger.info("Assignment source download started", {
    assignmentId,
    key,
    fileUrl
  });

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key
    })
  );

  if (!response.Body) {
    throw new Error("Source file not found");
  }

  const buffer = await streamToBuffer(response.Body as NodeJS.ReadableStream);

  assignmentFileLogger.info("Assignment source download completed", {
    assignmentId,
    key,
    fileUrl,
    sizeBytes: buffer.length
  });

  return {
    fileUrl,
    buffer
  };
};

export const uploadAssignmentPdfFile = async (
  assignmentId: string,
  generationId: string,
  buffer: Buffer
): Promise<{ fileUrl: string }> => {
  const key = getAssignmentPdfKey(assignmentId, generationId);

  assignmentFileLogger.info("Assignment PDF upload started", {
    assignmentId,
    generationId,
    key,
    sizeBytes: buffer.length
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf"
    })
  );

  const fileUrl = `s3://${env.AWS_S3_BUCKET}/${key}`;

  assignmentFileLogger.info("Assignment PDF upload completed", {
    assignmentId,
    generationId,
    key,
    fileUrl
  });

  return { fileUrl };
};
