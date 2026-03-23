import { PlusIcon } from "lucide-react"

import type { GeneratorSectionFormItem } from "@/features/assignment-generator/types/generator.types"
import { QuestionTypeCard } from "./QuestionTypeCard"

type QuestionTypeEditorProps = {
  error?: string
  isLocked?: boolean
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
  error,
  isLocked = false,
  sections,
  totalMarks,
  totalQuestions,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
}: QuestionTypeEditorProps) => {
  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">Question Type</h3>
        <p className="text-sm text-muted-foreground">
          Build the section mix you want to generate.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <QuestionTypeCard
            canRemove={sections.length > 1}
            isLocked={isLocked}
            key={section.id}
            onRemove={onRemoveSection}
            onUpdate={onUpdateSection}
            section={section}
          />
        ))}
        {error ? <p className="text-xs text-destructive pl-1">{error}</p> : null}
      </div>

      <button
        className="inline-flex items-center gap-3 text-sm font-medium text-foreground transition hover:text-foreground/80 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLocked}
        onClick={onAddSection}
        type="button"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <PlusIcon className="size-4" />
        </span>
        Add Question Type
      </button>

      <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3.5">
        <p className="text-xs text-muted-foreground">Section totals</p>

        <div className="mt-2 flex items-center justify-between text-sm font-medium text-foreground">
          <p>Total Questions: {totalQuestions}</p>
          <p>Total Marks: {totalMarks}</p>
        </div>
      </div>
    </section>
  )
}
