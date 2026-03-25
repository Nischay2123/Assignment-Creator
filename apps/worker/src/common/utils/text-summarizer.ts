import { logger } from "@repo/logger";

const textSummarizerLogger = logger.child({ module: "text-summarizer" });

/**
 * Builds a concise prompt for Gemini to summarize oversized extracted text
 * while preserving key educational content and structure
 */
export const buildSummarizationPrompt = (
  text: string,
  assignmentTitle: string,
  assignmentInstructions: string,
  targetLength: number = 12000
): string => {
  return [
    "ROLE",
    "You are an expert document summarizer specializing in educational materials. Your task is to condense lengthy text while preserving all critical educational content.",
    "",
    "TASK",
    `Summarize the following document to approximately ${targetLength} characters. The summary will be used to generate exam questions.`,
    "",
    "REQUIREMENTS",
    "1. Preserve all key concepts, definitions, and technical terms.",
    "2. Maintain the logical structure and flow of information.",
    "3. Include all important examples and case studies.",
    "4. Remove redundancy and excessive elaboration.",
    "5. Keep the language clear and academic in tone.",
    "6. Return ONLY the summarized text, no additional commentary.",
    "7. Do NOT include a preamble or conclusion about the summarization.",
    "",
    "ASSIGNMENT_CONTEXT",
    `Title: ${assignmentTitle}`,
    `Instructions: ${assignmentInstructions}`,
    "",
    "DOCUMENT_TO_SUMMARIZE",
    text,
    "",
    "SUMMARIZED_OUTPUT"
  ].join("\n");
};

/**
 * Validates that summarized text is within acceptable length and quality
 */
export const validateSummarizedText = (
  text: string,
  minLength: number = 200,
  maxLength: number = 15000
): { valid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      error: "Summarized text is empty"
    };
  }

  const trimmedLength = text.trim().length;

  if (trimmedLength < minLength) {
    return {
      valid: false,
      error: `Summarized text is too short (${trimmedLength} chars, minimum ${minLength})`
    };
  }

  if (trimmedLength > maxLength) {
    return {
      valid: false,
      error: `Summarized text exceeds maximum length (${trimmedLength} chars, maximum ${maxLength})`
    };
  }

  return { valid: true };
};

/**
 * Logs summarization operation details
 */
export const logSummarizationEvent = (
  assignmentId: string,
  originalLength: number,
  summaryLength: number,
  compressionRatio: number
): void => {
  textSummarizerLogger.info("Text summarization completed", {
    assignmentId,
    originalLength,
    summaryLength,
    compressionRatio: `${(compressionRatio * 100).toFixed(2)}%`
  });
};
