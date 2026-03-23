import { GeneratorFormCard } from "@/features/assignment-generator/components/GeneratorFormCard"
import { GeneratorHeader } from "@/features/assignment-generator/components/GeneratorHeader"
import { GeneratorSummaryCard } from "@/features/assignment-generator/components/GeneratorSummaryCard"
import { useGenerateAssignmentPage } from "@/features/assignment-generator/hooks/useGenerateAssignmentPage"

type GenerateAssignmentPageViewProps = {
  model: ReturnType<typeof useGenerateAssignmentPage>
}

export const GenerateAssignmentPageView = ({
  model,
}: GenerateAssignmentPageViewProps) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      <GeneratorHeader isEditMode={model.isEditMode} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <GeneratorFormCard model={model} />
        <div className="xl:sticky xl:top-24 xl:self-start">
          <GeneratorSummaryCard
            dueDate={model.form.dueDate}
            sourceFileName={model.form.sourceFileName}
            totalMarks={model.totals.totalMarks}
            totalQuestions={model.totals.totalQuestions}
          />
        </div>
      </div>
    </div>
  )
}
