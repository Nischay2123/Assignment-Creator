import { MinusIcon, PlusIcon, XIcon } from "lucide-react"

import { generatorDifficultyOptions, generatorQuestionOptions } from "@/features/assignment-generator/lib/generator-config"
import type { GeneratorSectionFormItem } from "@/features/assignment-generator/types/generator.types"
import { Textarea } from "@/components/ui/textarea"

type QuestionTypeCardProps = {
  canRemove: boolean
  isLocked?: boolean
  section: GeneratorSectionFormItem
  onRemove: (sectionId: string) => void
  onUpdate: (
    sectionId: string,
    patch: Partial<GeneratorSectionFormItem>
  ) => void
}

const clampValue = (value: number) => Math.max(1, value)

export const QuestionTypeCard = ({
  canRemove,
  isLocked = false,
  section,
  onRemove,
  onUpdate,
}: QuestionTypeCardProps) => {
  return (
    <div className="rounded-[28px] bg-background p-4 shadow-sm ring-1 ring-foreground/8 sm:p-5">
      <div className="flex items-start gap-3">
        <select
          className="h-12 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none"
          disabled={isLocked}
          onChange={(event) => {
            const nextType = event.target.value as GeneratorSectionFormItem["questionType"]
            const option = generatorQuestionOptions.find((item) => item.value === nextType)
            onUpdate(section.id, { label: option?.label ?? section.label, questionType: nextType })
          }}
          value={section.questionType}
        >
          {generatorQuestionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-transparent text-muted-foreground transition hover:border-border/60 hover:bg-muted hover:text-foreground disabled:opacity-40"
          disabled={isLocked || !canRemove}
          onClick={() => onRemove(section.id)}
          type="button"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <label className="mt-3 block space-y-2 sm:mt-4">
        <span className="text-sm font-medium text-foreground">Section Instruction</span>
        <Textarea
          className="min-h-20 rounded-2xl border border-border bg-background px-4 py-3 text-sm"
          disabled={isLocked}
          onChange={(event) => onUpdate(section.id, { instruction: event.target.value })}
          placeholder="For example: Attempt only 2 questions."
          value={section.instruction}
        />
      </label>

      <div className="mt-3.5 grid gap-3 sm:mt-4 sm:grid-cols-[1fr_150px_150px] sm:gap-4">
        <CounterField
          disabled={isLocked}
          label="No. of Questions"
          onChange={(value) => onUpdate(section.id, { count: value })}
          value={section.count}
        />
        <CounterField
          disabled={isLocked}
          label="Marks"
          onChange={(value) => onUpdate(section.id, { marksPerQuestion: value })}
          value={section.marksPerQuestion}
        />
        <label className="space-y-2">
          <span className="text-sm font-medium text-foreground">Difficulty</span>
          <select
            className="h-12 w-full rounded-full border border-border bg-background px-4 text-sm text-foreground outline-none"
            disabled={isLocked}
            onChange={(event) =>
              onUpdate(section.id, {
                difficulty: event.target.value as GeneratorSectionFormItem["difficulty"],
              })
            }
            value={section.difficulty}
          >
            {generatorDifficultyOptions.map((option) => (
              <option key={option} value={option}>
                {option[0]?.toUpperCase()}
                {option.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

type CounterFieldProps = {
  disabled?: boolean
  label: string
  value: number
  onChange: (value: number) => void
}

const CounterField = ({ disabled = false, label, value, onChange }: CounterFieldProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex h-12 items-center justify-between rounded-full bg-muted/70 px-3">
        <button
          className="flex size-8 items-center justify-center rounded-full transition hover:bg-background disabled:opacity-40"
          disabled={disabled}
          onClick={() => onChange(clampValue(value - 1))}
          type="button"
        >
          <MinusIcon className="size-4 text-muted-foreground" />
        </button>
        <span className="text-base font-semibold text-foreground">{value}</span>
        <button
          className="flex size-8 items-center justify-center rounded-full transition hover:bg-background disabled:opacity-40"
          disabled={disabled}
          onClick={() => onChange(clampValue(value + 1))}
          type="button"
        >
          <PlusIcon className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
