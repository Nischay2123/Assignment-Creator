import type { HydratedDocument, Types } from "mongoose";

import type {
  AssignmentDifficulty,
  AssignmentQuestionType
} from "./assignment.types.js";

export type GenerationStatus = "queued" | "processing" | "completed" | "failed";
export type PdfStatus = "pending" | "generated" | "failed";

export interface GeneratedQuestion {
  question: string;
  type: AssignmentQuestionType;
  difficulty: AssignmentDifficulty;
  marks: number;
  options?: string[];
}

export interface GeneratedSection {
  sectionId: string;
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GenerationResult {
  sections: GeneratedSection[];
}

export interface Generation {
  assignmentId: Types.ObjectId;
  userId: Types.ObjectId;
  version: number;
  status: GenerationStatus;
  result?: GenerationResult;
  pdfUrl?: string;
  pdfStatus: PdfStatus;
  prompt?: string;
  rawResponse?: string;
  error?: string;
  processingTimeMs?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export type GenerationDocument = HydratedDocument<Generation>;

export interface CreateGenerationInput {
  assignmentId: string;
}

export interface GenerationResponse {
  id: string;
  assignmentId: string;
  userId: string;
  version: number;
  status: GenerationStatus;
  result?: GenerationResult;
  pdfUrl?: string;
  pdfStatus: PdfStatus;
  prompt?: string;
  rawResponse?: string;
  error?: string;
  processingTimeMs?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGenerationResponse {
  message: string;
  generation: GenerationResponse;
  jobId: string;
  queueName: string;
  assignmentId: string;
}

export interface GenerationPdfDownloadUrlResponse {
  url: string;
  expiresAt: string;
}

export interface GenerationJobData {
  assignmentId: string;
  generationId: string;
}

export interface PdfGenerationJobData {
  assignmentId: string;
  generationId: string;
  forceRegenerate?: boolean;
}

export interface CreateGenerationJobResult {
  rawResponse: string;
  result: GenerationResult;
}

export type PdfGenerationStatus = "pending" | "generating" | "completed" | "failed";

export interface PdfGenerationSocketEvent {
  generationId: string;
  status: PdfGenerationStatus;
  pdfUrl?: string;
  error?: string;
}

export interface GenerationSocketEvent {
  assignmentId: string;
  status: GenerationStatus;
  generation?: GenerationResponse;
  error?: string;
}
