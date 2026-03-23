import { PlusIcon } from "lucide-react"

import type { GeneratorSectionFormItem } from "@/features/assignment-generator/types/generator.types"
import { QuestionTypeCard } from "./QuestionTypeCard"

type QuestionTypeEditorProps = {
  sections: GeneratorSectionFormItem[]
  totalMarks: number
  totalQuestions: number
  onAddSection: () => void
  onRemoveSection: (sectionId: string) => void
  onUpdateSection: (
    sectionId: string,
    patch: Partial<GeneratorSectionFormItem>
  ) => void
}

export const QuestionTypeEditor = ({
  sections,
  totalMarks,
  totalQuestions,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
}: QuestionTypeEditorProps) => {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Question Type</h3>
        <p className="text-sm text-muted-foreground">
          Build the section mix you want to generate.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <QuestionTypeCard
            canRemove={sections.length > 1}
            key={section.id}
            onRemove={onRemoveSection}
            onUpdate={onUpdateSection}
            section={section}
          />
        ))}
      </div>

      <button
        className="inline-flex items-center gap-3 rounded-full px-1 py-1 text-sm font-medium text-foreground transition hover:text-foreground/80"
        onClick={onAddSection}
        type="button"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <PlusIcon className="size-4" />
        </span>
        Add Question Type
      </button>

      <div className="space-y-1 text-right">
        <p className="text-lg font-medium text-foreground">Total Questions : {totalQuestions}</p>
        <p className="text-lg font-medium text-foreground">Total Marks : {totalMarks}</p>
      </div>
    </section>
  )
}
