import type { HydratedDocument } from "mongoose";

export type AssignmentQuestionType = "MCQ" | "SHORT" | "LONG";
export type AssignmentDifficulty = "easy" | "medium" | "hard";
export type AssignmentSourceMaterialType = "file" | "text";

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

export interface AssignmentSourceMaterial {
  type: AssignmentSourceMaterialType;
  content: string;
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

export interface CreateAssignmentInput {
  title: string;
  instructions: string;
  dueDate: Date;
  sections: AssignmentSection[];
  sourceMaterial?: AssignmentSourceMaterial;
}

export interface UpdateAssignmentInput {
  instructions?: string;
  sourceMaterial?: AssignmentSourceMaterial;
}

export interface AssignmentResponse {
  id: string;
  title: string;
  instructions: string;
  dueDate: Date;
  sections: AssignmentSection[];
  sourceMaterial?: AssignmentSourceMaterial;
  createdAt: Date;
  updatedAt: Date;
}
