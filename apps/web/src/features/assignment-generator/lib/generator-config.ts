import type {
  GeneratorOption,
  GeneratorSectionFormItem,
} from "@/features/assignment-generator/types/generator.types"

export const generatorQuestionOptions: GeneratorOption[] = [
  { label: "Multiple Choice Questions", value: "MCQ" },
  { label: "Short Questions", value: "SHORT" },
  { label: "Long Questions", value: "LONG" },
]

export const generatorDifficultyOptions = ["easy", "medium", "hard"] as const

const createId = () => {
  return `section-${Math.random().toString(36).slice(2, 10)}`
}

export const createGeneratorSection = (
  questionType: GeneratorOption["value"] = "MCQ"
): GeneratorSectionFormItem => {
  const option =
    generatorQuestionOptions.find((item) => item.value === questionType) ??
    generatorQuestionOptions[0]

  return {
    id: createId(),
    label: option.label,
    questionType: option.value,
    difficulty: "medium",
    count: 4,
    marksPerQuestion: 1,
  }
}
