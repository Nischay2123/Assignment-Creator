import { logger } from "@repo/logger";
import mammoth from "mammoth";
import { fileTypeFromBuffer } from "file-type";
import { PDFParse } from "pdf-parse";

import type { AssignmentDocument, DocumentType } from "../../common/types/assignment.types.js";
import type { FileProcessingJobData } from "../../common/types/file-processing.types.js";
import { AssignmentModel } from "./assignment.model.js";
import { downloadAssignmentSourceFile } from "./file.service.js";

type SupportedFileType = "pdf" | "docx" | "txt";

const MAX_EXTRACTED_TEXT_LENGTH = 15000;
const MIN_EXTRACTED_TEXT_LENGTH = 200;
const MAX_NON_ALPHANUMERIC_RATIO = 0.6;

const fileProcessingLogger = logger.child({ module: "worker-file-processor" });

// Document Parser - Detectstype and extracts raw structured data
interface DocumentParseResult {
  type: DocumentType;
  parsedData: Record<string, any>;
}

const parseDocument = (text: string): DocumentParseResult => {
  const lowerText = text.toLowerCase();

  // Calculate scores for each document type
  let syllabusScore = 0;
  let notesScore = 0;
  let textbookScore = 0;
  let questionsScore = 0;

  // Syllabus pattern detection
  if (/course|class|semester|taught|objectives|grading|prerequisites|credit|hours/i.test(lowerText)) {
    syllabusScore += 3;
  }
  if (/syllabus|course description|course outline/i.test(lowerText)) {
    syllabusScore += 2;
  }

  // Notes pattern detection
  if (/note|lecture|class note|revision|summary|important|key point/i.test(lowerText)) {
    notesScore += 3;
  }

  // Textbook pattern detection
  if (/chapter|section|introduction|conclusion|definition|concept|formula|theory|principle|law/i.test(lowerText)) {
    textbookScore += 3;
  }

  // Questions pattern detection
  const questionCount = (text.match(/\?(?:\s|$)/g) || []).length;
  const hasOptions = /^[a-d]\)|option\s*[a-d]/im.test(text);
  const hasMCQ = /mcq|multiple choice|true.*false/i.test(lowerText);

  if (questionCount > 3 || hasOptions || hasMCQ) questionsScore += 3;
  if (questionCount > 5) questionsScore += 2;

  // Determine primary type
  const scores = { syllabus: syllabusScore, notes: notesScore, textbook: textbookScore, questions: questionsScore };
  const maxScore = Math.max(...Object.values(scores));
  let type: DocumentType = "unknown";

  if (maxScore > 0) {
    type = (Object.entries(scores).find(([_, v]) => v === maxScore)?.[0] as DocumentType) || "unknown";
  }

  // Check for mixed content
  const multipleTypes = Object.values(scores).filter((s) => s > 2).length;
  if (multipleTypes > 1) {
    type = "mixed";
  }

  // Extract raw structured data based on type
  const parsedData = extractRawData(text, type);

  return { type, parsedData };
};

const extractRawData = (text: string, type: DocumentType): Record<string, any> => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  switch (type) {
    case "syllabus":
      return extractSyllabusData(lines);
    case "notes":
    case "textbook":
      return extractTopicsData(lines);
    case "questions":
      return extractQuestionsData(lines);
    case "mixed":
      return {
        syllabus: extractSyllabusData(lines),
        topics: extractTopicsData(lines),
        questions: extractQuestionsData(lines),
      };
    default:
      return { summary: text.slice(0, 300) };
  }
};

const extractSyllabusData = (lines: string[]): Record<string, any> => {
  const data: Record<string, any> = {
    courses: [],
    chapters_or_units: [],
    objectives: [],
  };

  lines.forEach((line) => {
    if (/^(course|class|subject):/i.test(line)) {
      data.courses.push(line.replace(/^(course|class|subject):\s*/i, ""));
    } else if (/^(chapter|unit|module|topic):/i.test(line)) {
      data.chapters_or_units.push(line.replace(/^(chapter|unit|module|topic):\s*/i, ""));
    } else if (/^(objective|learning objective|outcome):/i.test(line)) {
      data.objectives.push(line.replace(/^(objective|learning objective|outcome):\s*/i, ""));
    }
  });

  return data;
};

const extractTopicsData = (lines: string[]): Record<string, any> => {
  const data: Record<string, any> = {
    topics: [],
    definitions: [],
    key_concepts: [],
    formulas: [],
  };

  lines.forEach((line) => {
    // Detect formulas/equations
    if (/[=\+\-\*\/\(\)\^\d]/.test(line) && line.length > 5 && line.length < 150) {
      data.formulas.push(line);
    }
    // Detect definitions
    else if (/^(definition|defined as|term|concept):/i.test(line)) {
      data.definitions.push(line.replace(/^(definition|defined as|term|concept):\s*/i, ""));
    }
    // Collect other content as concepts
    else if (line.length > 10) {
      data.key_concepts.push(line);
    }
  });

  // Limit arrays to prevent oversized data
  data.key_concepts = data.key_concepts.slice(0, 30);
  data.formulas = data.formulas.slice(0, 20);

  return data;
};

const extractQuestionsData = (lines: string[]): Record<string, any> => {
  const data: Record<string, any> = {
    questions: [],
  };

  let currentQuestion: Record<string, any> | null = null;

  lines.forEach((line) => {
    // Detect question start
    if (/^(q\s*\d+|question\s*\d+|\d+\.)/i.test(line)) {
      if (currentQuestion) {
        data.questions.push(currentQuestion);
      }

      currentQuestion = {
        text: line.replace(/^(q\s*\d+|question\s*\d+|\d+\.)\s*/i, ""),
        options: [],
        answer: "",
      };
    } else if (currentQuestion) {
      // Detect options
      if (/^[a-d]\)|^option\s*[a-d]/i.test(line)) {
        currentQuestion.options.push(line.replace(/^[a-d]\)|\s*option\s*[a-d]/i, ""));
      }
      // Detect answer
      else if (/^answer|^ans|^correct/i.test(line)) {
        currentQuestion.answer = line.replace(/^(answer|ans|correct):\s*/i, "");
      }
    }
  });

  if (currentQuestion) {
    data.questions.push(currentQuestion);
  }

  // Limit to 50 questions
  data.questions = data.questions.slice(0, 50);

  return data;
};

const cleanExtractedText = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

const getNonAlphanumericRatio = (text: string): number => {
  const alphanumericCharacters = text.match(/[a-z0-9]/gi)?.length ?? 0;

  return (text.length - alphanumericCharacters) / text.length;
};

const isLikelyTextFile = (buffer: Buffer): boolean => {
  if (buffer.includes(0)) {
    return false;
  }

  const decodedText = buffer.toString("utf-8");
  const sanitizedText = decodedText.replace(/[\r\n\t ]/g, "");

  return sanitizedText.length > 0;
};

const detectFileType = async (buffer: Buffer): Promise<SupportedFileType> => {
  if (buffer.subarray(0, 5).toString("utf-8") === "%PDF-") {
    return "pdf";
  }

  const detectedFileType = await fileTypeFromBuffer(buffer);

  if (detectedFileType?.mime === "application/pdf") {
    return "pdf";
  }

  if (
    detectedFileType?.mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  if (isLikelyTextFile(buffer)) {
    return "txt";
  }

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
  if (fileType === "pdf") {
    return parsePdfBuffer(buffer);
  }

  if (fileType === "docx") {
    return parseDocxBuffer(buffer);
  }

  return parseTxtBuffer(buffer);
};

const updateFailedSourceMaterial = async (
  assignment: AssignmentDocument,
  errorMessage: string
): Promise<void> => {
  if (!assignment.sourceMaterial?.file) {
    return;
  }

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

      // Parse document to detect type and extract structured data
      const { type: documentType, parsedData } = parseDocument(cleanedExtractedText);

      assignment.sourceMaterial.file.status = "processed";
      assignment.sourceMaterial.file.extractedText = cleanedExtractedText.slice(
        0,
        MAX_EXTRACTED_TEXT_LENGTH
      );
      assignment.sourceMaterial.file.documentType = documentType;
      assignment.sourceMaterial.file.parsedData = parsedData;
      assignment.sourceMaterial.file.error = undefined;
      await assignment.save();

      fileProcessingLogger.info("File parsing completed", {
        assignmentId: payload.assignmentId,
        fileUrl: payload.fileUrl,
        detectedFileType,
        documentType,
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
