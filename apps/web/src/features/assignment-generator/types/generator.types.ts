import type {
  AssignmentDifficulty,
  AssignmentQuestionType,
} from "@/features/assignments/types/assignment.types"

export type GeneratorSectionFormItem = {
  id: string
  label: string
  questionType: AssignmentQuestionType
  difficulty: AssignmentDifficulty
  count: number
  marksPerQuestion: number
}

export type GeneratorOption = {
  label: string
  value: AssignmentQuestionType
}

export type GeneratorFormState = {
  title: string
  dueDate: string
  additionalInfo: string
  sourceFileName: string
  sections: GeneratorSectionFormItem[]
}

export type GeneratorFormErrors = {
  title: string
  dueDate: string
  additionalInfo: string
  sections: string
}
