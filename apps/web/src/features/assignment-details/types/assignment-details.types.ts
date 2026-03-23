import type {
  AssignmentRecord,
  AssignmentSectionInput,
  GenerationRecord,
} from "@/features/assignments/types/assignment.types"

export type AssignmentInfoItem = {
  label: string
  value: string
}

export type SectionInfoItem = {
  id: string
  title: string
  instruction: string
  questionType: string
  questionCount: number
  marksPerQuestion: number
  difficulty: string
}

export type GenerationVersionRow = {
  id: string
  versionLabel: string
  statusLabel: string
  createdOnLabel: string
  pdfLink: string | null
  pdfLabel: string
}

export type AssignmentDetailsViewModel = {
  assignmentTitle: string
  feedbackMessage: string
  isGenerating: boolean
  isLoading: boolean
  isNotFound: boolean
  hasError: boolean
  infoItems: AssignmentInfoItem[]
  sections: SectionInfoItem[]
  generationRows: GenerationVersionRow[]
  onBack: () => void
  onGenerate: () => Promise<void>
  onEdit: () => void
}

export const toSectionInfoItems = (sections: AssignmentSectionInput[]): SectionInfoItem[] => {
  return sections.map((section) => ({
    id: section.sectionId,
    title: section.title,
    instruction: section.instruction,
    questionType: section.questionConfig.type,
    questionCount: section.questionConfig.count,
    marksPerQuestion: section.questionConfig.marksPerQuestion,
    difficulty: section.questionConfig.difficulty,
  }))
}

export const sortGenerationRows = (rows: GenerationRecord[]) => {
  return [...rows].sort((left, right) => right.version - left.version)
}

export const getAssignmentById = (
  assignments: AssignmentRecord[],
  assignmentId: string
) => assignments.find((assignment) => assignment.id === assignmentId)
