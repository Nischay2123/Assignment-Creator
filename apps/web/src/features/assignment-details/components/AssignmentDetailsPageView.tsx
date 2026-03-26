import { Button } from "@/components/ui/button"
import { RefreshCwIcon } from "lucide-react"
import { AssignmentOverviewCard } from "@/features/assignment-details/components/AssignmentOverviewCard"
import { GenerationVersionsTable } from "@/features/assignment-details/components/GenerationVersionsTable"
import { PdfPreviewModal } from "@/features/assignment-details/components/PdfPreviewModal"
import { RegeneratePdfDialog } from "@/features/assignment-details/components/RegeneratePdfDialog"
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
        <Button
          disabled={model.isRefetching}
          onClick={model.onRefetch}
          size="lg"
          variant="outline"
        >
          {model.isRefetching ? (
            <>
              <RefreshCwIcon className="mr-2 size-4 animate-spin" />
              Refetching...
            </>
          ) : (
            <>
              <RefreshCwIcon className="mr-2 size-4" />
              Refetch
            </>
          )}
        </Button>
      </section>

      <GenerationVersionsTable 
        rows={model.generationRows}
        onPreviewClick={model.onPreviewClick}
      />

      <PdfPreviewModal
        generation={model.selectedGeneration}
        isOpen={model.isPdfModalOpen}
        isRegenerating={model.isPdfRegenerating}
        onClose={model.onClosePdfModal}
        onRegenerate={model.onShowRegenerateConfirm}
      />

      <RegeneratePdfDialog
        isOpen={model.isRegenerateConfirmOpen}
        isLoading={model.isPdfRegenerating}
        onConfirm={model.onConfirmRegenerate}
        onCancel={model.onCancelRegenerate}
      />
    </div>
  )
}
