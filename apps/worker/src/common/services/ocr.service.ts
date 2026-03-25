import { logger } from "@repo/logger";
import Tesseract from "tesseract.js";

const ocrLogger = logger.child({ module: "ocr-service" });
const OCR_TIMEOUT_MS = 60000; // 60 seconds timeout for OCR operations

/**
 * Extracts text from PDF images using Tesseract.js OCR
 * Handles scanned PDFs and image-based PDFs that regular text extraction can't process
 */
export const extractTextFromPdfImages = async (
  buffer: Buffer,
  assignmentId: string
): Promise<string> => {
  ocrLogger.info("Starting OCR extraction from PDF images", { assignmentId });

  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => {
    abortController.abort();
  }, OCR_TIMEOUT_MS);

  try {
    // Convert PDF buffer to base64 for Tesseract.js
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64Data}`;

    // Use Tesseract.js to extract text from images in the PDF
    const result = await Tesseract.recognize(dataUrl, "eng", {
      logger: (message) => {
        if (message.status === "recognizing") {
          ocrLogger.debug("OCR in progress", {
            assignmentId,
            progress: message.progress
          });
        }
      }
    });

    const extractedText = result.data.text;

    ocrLogger.info("OCR extraction completed", {
      assignmentId,
      extractedLength: extractedText.length,
      confidence: result.data.confidence
    });

    return extractedText;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      ocrLogger.error("OCR extraction timed out", {
        assignmentId,
        timeoutMs: OCR_TIMEOUT_MS
      });
      throw new Error(`OCR extraction timed out after ${OCR_TIMEOUT_MS}ms`);
    }

    ocrLogger.error("OCR extraction failed", {
      assignmentId,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    throw new Error(
      `OCR extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
};

/**
 * Estimates if a PDF likely contains significant image content
 * by checking the ratio of extracted text to file size
 */
export const estimatePdfHasImages = (
  extractedTextLength: number,
  bufferSize: number,
  minRatio: number = 0.01
): boolean => {
  // If extracted text is less than 1% of file size, likely contains images
  const ratio = extractedTextLength / bufferSize;
  return ratio < minRatio;
};
