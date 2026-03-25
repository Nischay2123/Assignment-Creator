import type { HydratedDocument } from "mongoose";

export type AssignmentQuestionType = "MCQ" | "SHORT" | "LONG";
export type AssignmentDifficulty = "easy" | "medium" | "hard";
export type AssignmentSourceMaterialFileStatus = "pending" | "processed" | "failed";
export type DocumentType = "syllabus" | "notes" | "textbook" | "questions" | "mixed" | "unknown";

export interface AssignmentQuestionConfig {
  type: AssignmentQuestionType;
  count: number;
  marksPerQuestion: number;
  difficulty: AssignmentDifficulty;
}

export interface AssignmentSection {
  sectionId: string;
  title: string;
  instruction: string;
  questionConfig: AssignmentQuestionConfig;
}

export interface AssignmentTextSourceMaterial {
  content: string;
}

export interface AssignmentFileSourceMaterial {
  fileUrl: string;
  extractedText?: string;
  status: AssignmentSourceMaterialFileStatus;
  error?: string;
  documentType?: DocumentType;
  parsedData?: Record<string, any>;
}

export interface AssignmentSourceMaterial {
  text?: AssignmentTextSourceMaterial;
  file?: AssignmentFileSourceMaterial;
}

export interface Assignment {
  title: string;
  instructions: string;
  dueDate: Date;
  sections: AssignmentSection[];
  sourceMaterial?: AssignmentSourceMaterial;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export type AssignmentDocument = HydratedDocument<Assignment>;
