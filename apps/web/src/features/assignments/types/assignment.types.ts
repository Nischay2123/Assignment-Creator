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

export type SourceMaterialTextInput = {
  content: string
}

export type SourceMaterialFileInput = {
  fileUrl: string
  extractedText?: string
  status: "pending" | "processed" | "failed"
  error?: string
}

export type SourceMaterialInput = {
  text?: SourceMaterialTextInput
  file?: SourceMaterialFileInput
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
  pdfUrl?: string
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
  jobId: string
  queueName: string
  assignmentId: string
}

export type GenerationSocketEvent = {
  assignmentId: string
  status: GenerationStatus
  generation?: GenerationRecord
  error?: string
}

export type AssignmentListItem = {
  id: string
  title: string
  assignedOn: string
  dueOn: string
  status: AssignmentStatus
  latestGenerationLabel: string
}
