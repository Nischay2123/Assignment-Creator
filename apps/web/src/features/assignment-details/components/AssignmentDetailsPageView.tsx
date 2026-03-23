import { Button } from "@/components/ui/button"
import { AssignmentOverviewCard } from "@/features/assignment-details/components/AssignmentOverviewCard"
import { GenerationVersionsTable } from "@/features/assignment-details/components/GenerationVersionsTable"
import { useAssignmentDetailsPage } from "@/features/assignment-details/hooks/useAssignmentDetailsPage"

type AssignmentDetailsPageViewProps = {
  model: ReturnType<typeof useAssignmentDetailsPage>
}

export const AssignmentDetailsPageView = ({ model }: AssignmentDetailsPageViewProps) => {
  if (model.isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card px-5 py-8 text-sm text-muted-foreground">
        Loading assignment details...
      </div>
    )
  }

  if (model.isNotFound) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/10 px-5 py-8 text-sm text-destructive">
        Assignment not found.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {model.assignmentTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review sections, difficulty settings, and generation versions.
        </p>
      </header>

      <section>
        <Button onClick={model.onBack} size="lg" variant="outline">
          Back
        </Button>
      </section>

      {model.hasError ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Unable to load all details. Please refresh and try again.
        </div>
      ) : null}

      {model.feedbackMessage ? (
        <div className="rounded-3xl border border-border bg-card px-4 py-3 text-sm text-foreground">
          {model.feedbackMessage}
        </div>
      ) : null}

      <AssignmentOverviewCard infoItems={model.infoItems} sections={model.sections} />

      <section className="flex flex-wrap gap-3">
        <Button disabled={model.isGenerating} onClick={model.onGenerate} size="lg" variant="default">
          {model.isGenerating ? "Generating..." : "Generate"}
        </Button>
        <Button onClick={model.onEdit} size="lg" variant="outline">
          Edit
        </Button>
      </section>

      <GenerationVersionsTable rows={model.generationRows} />
    </div>
  )
}
