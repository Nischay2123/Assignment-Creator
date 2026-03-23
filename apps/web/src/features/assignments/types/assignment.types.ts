export type AssignmentStatus = "active" | "review" | "scheduled"
export type AssignmentFilter = "all" | AssignmentStatus
export type AssignmentQuestionType = "MCQ" | "SHORT" | "LONG"
export type AssignmentDifficulty = "easy" | "medium" | "hard"
export type GenerationStatus = "queued" | "processing" | "completed" | "failed"

export type AssignmentQuestionConfig = {
  type: AssignmentQuestionType
  count: number
  marksPerQuestion: number
  difficulty: AssignmentDifficulty
}

export type AssignmentSectionInput = {
  sectionId: string
  title: string
  instruction: string
  questionConfig: AssignmentQuestionConfig
}

export type SourceMaterialInput = {
  type: "file" | "text"
  content: string
}

export type AssignmentRecord = {
  id: string
  title: string
  instructions: string
  dueDate: string
  sections: AssignmentSectionInput[]
  sourceMaterial?: SourceMaterialInput
  createdAt: string
  updatedAt: string
}

export type GenerationRecord = {
  id: string
  assignmentId: string
  version: number
  status: GenerationStatus
  pdfStatus: "pending" | "generated" | "failed"
  prompt?: string
  rawResponse?: string
  error?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type CreateGenerationResult = {
  message: string
  generation: GenerationRecord
}

export type AssignmentListItem = {
  id: string
  title: string
  assignedOn: string
  dueOn: string
  status: AssignmentStatus
  latestGenerationLabel: string
}
