import { logger } from "@repo/logger";
import mammoth from "mammoth";
import { fileTypeFromBuffer } from "file-type";
import { PDFParse } from "pdf-parse";

import type { AssignmentDocument } from "../../common/types/assignment.types.js";
import type { FileProcessingJobData } from "../../common/types/file-processing.types.js";
import { AssignmentModel } from "./assignment.model.js";
import { downloadAssignmentSourceFile } from "./file.service.js";

type SupportedFileType = "pdf" | "docx" | "txt";

const MAX_EXTRACTED_TEXT_LENGTH = 15000;
const MIN_EXTRACTED_TEXT_LENGTH = 200;
const MAX_NON_ALPHANUMERIC_RATIO = 0.6;

const fileProcessingLogger = logger.child({ module: "worker-file-processor" });

const cleanExtractedText = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

const getNonAlphanumericRatio = (text: string): number => {
  const alphanumericCharacters = text.match(/[a-z0-9]/gi)?.length ?? 0;
  return (text.length - alphanumericCharacters) / text.length;
};

const isLikelyTextFile = (buffer: Buffer): boolean => {
  if (buffer.includes(0)) return false;

  const decodedText = buffer.toString("utf-8");
  const sanitizedText = decodedText.replace(/[\r\n\t ]/g, "");

  return sanitizedText.length > 0;
};

const detectFileType = async (buffer: Buffer): Promise<SupportedFileType> => {
  if (buffer.subarray(0, 5).toString("utf-8") === "%PDF-") {
    return "pdf";
  }

  const detectedFileType = await fileTypeFromBuffer(buffer);

  if (detectedFileType?.mime === "application/pdf") return "pdf";

  if (
    detectedFileType?.mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  if (isLikelyTextFile(buffer)) return "txt";

  throw new Error("Unsupported file format. Only pdf, docx, and txt are allowed.");
};

const parsePdfBuffer = async (buffer: Buffer): Promise<string> => {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text ?? "";
  } catch {
    throw new Error("Corrupted file: unable to parse PDF");
  }
};

const parseDocxBuffer = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  } catch {
    throw new Error("Corrupted file: unable to parse DOCX");
  }
};

const parseTxtBuffer = (buffer: Buffer): string => {
  return buffer.toString("utf-8");
};

const extractTextByFileType = async (
  buffer: Buffer,
  fileType: SupportedFileType
): Promise<string> => {
  if (fileType === "pdf") return parsePdfBuffer(buffer);
  if (fileType === "docx") return parseDocxBuffer(buffer);
  return parseTxtBuffer(buffer);
};

const updateFailedSourceMaterial = async (
  assignment: AssignmentDocument,
  errorMessage: string
): Promise<void> => {
  if (!assignment.sourceMaterial?.file) return;

  assignment.sourceMaterial.file.status = "failed";
  assignment.sourceMaterial.file.extractedText = undefined;
  assignment.sourceMaterial.file.error = errorMessage;

  await assignment.save();
};

export class FileProcessor {
  async processJob(payload: FileProcessingJobData): Promise<void> {
    const assignment = await AssignmentModel.findById(payload.assignmentId);

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (!assignment.sourceMaterial?.file) {
      fileProcessingLogger.info("File processing skipped for non-file assignment", {
        assignmentId: payload.assignmentId
      });
      return;
    }

    if (assignment.sourceMaterial.file.fileUrl !== payload.fileUrl) {
      fileProcessingLogger.info("Stale file processing job skipped", {
        assignmentId: payload.assignmentId,
        assignmentFileUrl: assignment.sourceMaterial.file.fileUrl,
        jobFileUrl: payload.fileUrl
      });
      return;
    }

    fileProcessingLogger.info("File parsing started", {
      assignmentId: payload.assignmentId,
      fileUrl: payload.fileUrl
    });

    try {
      const downloadedFile = await downloadAssignmentSourceFile(payload.assignmentId);

      const detectedFileType = await detectFileType(downloadedFile.buffer);

      fileProcessingLogger.info("Source file type detected", {
        assignmentId: payload.assignmentId,
        fileUrl: payload.fileUrl,
        detectedFileType
      });

      const rawExtractedText = await extractTextByFileType(
        downloadedFile.buffer,
        detectedFileType
      );

      const cleanedExtractedText = cleanExtractedText(rawExtractedText);

      // 🔥 VALIDATIONS
      if (!cleanedExtractedText) {
        throw new Error("Empty extraction: no readable text found in file");
      }

      if (cleanedExtractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
        throw new Error("Too small extraction: extracted text is below minimum length");
      }

      const nonAlphanumericRatio = getNonAlphanumericRatio(cleanedExtractedText);

      if (nonAlphanumericRatio > MAX_NON_ALPHANUMERIC_RATIO) {
        throw new Error("Parsing failure: extracted text quality is too low");
      }

      // ✅ STORE ONLY RAW CLEAN TEXT
      assignment.sourceMaterial.file.status = "processed";
      assignment.sourceMaterial.file.extractedText = cleanedExtractedText.slice(
        0,
        MAX_EXTRACTED_TEXT_LENGTH
      );
      assignment.sourceMaterial.file.error = undefined;

      await assignment.save();

      fileProcessingLogger.info("File parsing completed", {
        assignmentId: payload.assignmentId,
        fileUrl: payload.fileUrl,
        detectedFileType,
        extractedLength: assignment.sourceMaterial.file.extractedText.length
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Parsing failure: unknown error";

      await updateFailedSourceMaterial(assignment, errorMessage);

      fileProcessingLogger.error("File parsing failed", {
        assignmentId: payload.assignmentId,
        fileUrl: payload.fileUrl,
        error: errorMessage
      });

      throw error;
    }
  }
}