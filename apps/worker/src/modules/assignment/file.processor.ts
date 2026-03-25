import { logger } from "@repo/logger";
import mammoth from "mammoth";
import { fileTypeFromBuffer } from "file-type";
import { PDFParse } from "pdf-parse";

import type { AssignmentDocument } from "../../common/types/assignment.types.js";
import type { FileProcessingJobData } from "../../common/types/file-processing.types.js";
import { extractTextFromPdfImages, estimatePdfHasImages } from "../../common/services/ocr.service.js";
import {
  buildSummarizationPrompt,
  validateSummarizedText,
  logSummarizationEvent
} from "../../common/utils/text-summarizer.js";
import { GenerationLlmService } from "../generation/generation-llm.service.js";
import { AssignmentModel } from "./assignment.model.js";
import { downloadAssignmentSourceFile } from "./file.service.js";

type SupportedFileType = "pdf" | "docx" | "txt";

const MAX_EXTRACTED_TEXT_LENGTH = 15000;
const MIN_EXTRACTED_TEXT_LENGTH = 200;
const MAX_NON_ALPHANUMERIC_RATIO = 0.6;
const TARGET_SUMMARIZED_LENGTH = 12000;

const fileProcessingLogger = logger.child({ module: "worker-file-processor" });
const generationLlmService = new GenerationLlmService();

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
  /**
   * Attempts to summarize oversized extracted text using LLM
   * when text exceeds MAX_EXTRACTED_TEXT_LENGTH
   */
  private async summarizeOversizedText(
    text: string,
    assignment: AssignmentDocument
  ): Promise<string> {
    fileProcessingLogger.info("Text exceeds maximum length, attempting LLM summarization", {
      assignmentId: assignment._id.toString(),
      originalLength: text.length,
      targetLength: TARGET_SUMMARIZED_LENGTH
    });

    try {
      const summarizationPrompt = buildSummarizationPrompt(
        text,
        assignment.title,
        assignment.instructions,
        TARGET_SUMMARIZED_LENGTH
      );

      const llmResponse = await generationLlmService.generateAssignment(summarizationPrompt);
      const summarizedText = llmResponse.rawResponse;

      // Validate summarized text
      const validation = validateSummarizedText(summarizedText);
      if (!validation.valid) {
        throw new Error(validation.error || "Summarized text validation failed");
      }

      const cleanedSummarized = cleanExtractedText(summarizedText);
      const compressionRatio = cleanedSummarized.length / text.length;

      logSummarizationEvent(
        assignment._id.toString(),
        text.length,
        cleanedSummarized.length,
        compressionRatio
      );

      fileProcessingLogger.info("LLM summarization succeeded", {
        assignmentId: assignment._id.toString(),
        originalLength: text.length,
        summarizedLength: cleanedSummarized.length,
        compressionRatio: `${(compressionRatio * 100).toFixed(2)}%`
      });

      return cleanedSummarized;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "LLM summarization failed: unknown error";

      fileProcessingLogger.error("LLM summarization failed", {
        assignmentId: assignment._id.toString(),
        error: errorMsg
      });

      // On LLM failure, truncate to MAX_EXTRACTED_TEXT_LENGTH as fallback
      fileProcessingLogger.info("Fallback: truncating text to maximum length", {
        assignmentId: assignment._id.toString(),
        truncatedLength: MAX_EXTRACTED_TEXT_LENGTH
      });

      return text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    }
  }

  /**
   * Attempts to extract text from image-based PDFs using OCR
   * when standard text extraction fails or produces low-quality output
   */
  private async extractFromPdfUsingOcr(
    buffer: Buffer,
    assignment: AssignmentDocument
  ): Promise<string> {
    fileProcessingLogger.info("Standard PDF parsing failed or low quality, attempting OCR fallback", {
      assignmentId: assignment._id.toString()
    });

    try {
      const ocrExtractedText = await extractTextFromPdfImages(
        buffer,
        assignment._id.toString()
      );

      const cleanedOcrText = cleanExtractedText(ocrExtractedText);

      fileProcessingLogger.info("OCR extraction succeeded", {
        assignmentId: assignment._id.toString(),
        extractedLength: cleanedOcrText.length
      });

      return cleanedOcrText;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "OCR extraction failed: unknown error";

      fileProcessingLogger.error("OCR extraction failed", {
        assignmentId: assignment._id.toString(),
        error: errorMsg
      });

      throw new Error(`OCR fallback failed: ${errorMsg}`);
    }
  }
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

      let rawExtractedText = await extractTextByFileType(
        downloadedFile.buffer,
        detectedFileType
      );

      let cleanedExtractedText = cleanExtractedText(rawExtractedText);
      let textProcessingPath = "standard"; // Track which path we took

      // 🔥 VALIDATION: Check for empty or low-quality extraction
      let isQualityIssue = false;

      if (!cleanedExtractedText) {
        fileProcessingLogger.warn("Empty extraction detected", {
          assignmentId: payload.assignmentId,
          detectedFileType
        });
        isQualityIssue = true;
      } else if (cleanedExtractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
        fileProcessingLogger.warn("Extraction too small", {
          assignmentId: payload.assignmentId,
          extractedLength: cleanedExtractedText.length,
          minimumRequired: MIN_EXTRACTED_TEXT_LENGTH,
          detectedFileType
        });
        isQualityIssue = true;
      } else {
        const nonAlphanumericRatio = getNonAlphanumericRatio(cleanedExtractedText);
        if (nonAlphanumericRatio > MAX_NON_ALPHANUMERIC_RATIO) {
          fileProcessingLogger.warn("Low quality extraction (high non-alphanumeric ratio)", {
            assignmentId: payload.assignmentId,
            ratio: nonAlphanumericRatio,
            maximum: MAX_NON_ALPHANUMERIC_RATIO,
            detectedFileType
          });
          isQualityIssue = true;
        }
      }

      // 🔥 FALLBACK 1: OCR for PDFs with quality issues
      if (isQualityIssue && detectedFileType === "pdf") {
        try {
          cleanedExtractedText = await this.extractFromPdfUsingOcr(
            downloadedFile.buffer,
            assignment
          );
          textProcessingPath = "ocr-fallback";

          // Re-validate after OCR
          if (!cleanedExtractedText || cleanedExtractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
            throw new Error("OCR fallback produced insufficient text");
          }

          const ocrNonAlphanumericRatio = getNonAlphanumericRatio(cleanedExtractedText);
          if (ocrNonAlphanumericRatio > MAX_NON_ALPHANUMERIC_RATIO) {
            throw new Error("OCR fallback produced low-quality text");
          }
        } catch (ocrError) {
          const errorMessage =
            ocrError instanceof Error ? ocrError.message : "OCR extraction failed";
          throw new Error(`${errorMessage}`);
        }
      } else if (isQualityIssue) {
        // Non-PDF files don't have OCR fallback
        if (!cleanedExtractedText) {
          throw new Error("Empty extraction: no readable text found in file");
        } else if (cleanedExtractedText.length < MIN_EXTRACTED_TEXT_LENGTH) {
          throw new Error("Too small extraction: extracted text is below minimum length");
        } else {
          throw new Error("Parsing failure: extracted text quality is too low");
        }
      }

      // 🔥 FALLBACK 2: LLM Summarization for oversized text
      if (cleanedExtractedText.length > MAX_EXTRACTED_TEXT_LENGTH) {
        const originalLength = cleanedExtractedText.length;
        cleanedExtractedText = await this.summarizeOversizedText(
          cleanedExtractedText,
          assignment
        );
        textProcessingPath =
          textProcessingPath === "ocr-fallback"
            ? "ocr-then-summarize"
            : "summarize-fallback";

        fileProcessingLogger.info("LLM summarization applied", {
          assignmentId: payload.assignmentId,
          originalLength,
          summarizedLength: cleanedExtractedText.length,
          processingPath: textProcessingPath
        });
      }

      // ✅ STORE PROCESSED TEXT
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
        extractedLength: assignment.sourceMaterial.file.extractedText.length,
        processingPath: textProcessingPath
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