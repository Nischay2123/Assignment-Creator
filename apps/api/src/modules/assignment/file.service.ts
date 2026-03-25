import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { logger } from "@repo/logger";

import { HttpError } from "../../common/errors/http-error.js";
import { env } from "../../config/env.js";
import { ASSIGNMENT_SOURCE_FILE_KEY_PREFIX } from "./file.constants.js";

const assignmentFileLogger = logger.child({ module: "assignment-file-service" });

const ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

const ALLOWED_FILE_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex < 0) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
};

const validateSourceFile = (assignmentId: string, file: Express.Multer.File): void => {
  const extension = getFileExtension(file.originalname);
  const isMimeAllowed = ALLOWED_FILE_MIME_TYPES.has(file.mimetype);
  const isExtensionAllowed = ALLOWED_FILE_EXTENSIONS.has(extension);

  if (!isMimeAllowed || !isExtensionAllowed) {
    assignmentFileLogger.warn("Unsupported source file upload", {
      assignmentId,
      mimeType: file.mimetype,
      extension
    });

    throw new HttpError(400, "Unsupported file format. Only pdf, docx, and txt are allowed.");
  }
};

const getAssignmentSourceKey = (assignmentId: string): string => {
  return `${ASSIGNMENT_SOURCE_FILE_KEY_PREFIX}/${assignmentId}/source`;
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
  file: Express.Multer.File
): Promise<{ fileUrl: string }> => {
  validateSourceFile(assignmentId, file);

  const key = getAssignmentSourceKey(assignmentId);

  assignmentFileLogger.info("Assignment source upload started", {
    assignmentId,
    key,
    mimeType: file.mimetype,
    sizeBytes: file.size
  });

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    const fileUrl = `s3://${env.AWS_S3_BUCKET}/${key}`;

    assignmentFileLogger.info("Assignment source upload completed", {
      assignmentId,
      key,
      fileUrl
    });

    return { fileUrl };
  } catch (error) {
    assignmentFileLogger.error("Assignment source upload failed", {
      assignmentId,
      key,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    throw new HttpError(500, "Failed to upload source file");
  }
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
    throw new HttpError(404, "Source file not found");
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
