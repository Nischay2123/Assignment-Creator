import { AssignmentsEmptyState } from "@/features/assignments/components/AssignmentsEmptyState"
import { AssignmentsGrid } from "@/features/assignments/components/AssignmentsGrid"
import { AssignmentsToolbar } from "@/features/assignments/components/AssignmentsToolbar"
import { useAssignmentsPage } from "@/features/assignments/hooks/useAssignmentsPage"

type AssignmentsPageViewProps = {
  model: ReturnType<typeof useAssignmentsPage>
}

export const AssignmentsPageView = ({ model }: AssignmentsPageViewProps) => {
  const titleSizeClass = model.isMobile ? "text-2xl" : "text-3xl"
  const subtitleClass = model.isMobile ? "max-w-sm text-sm" : "max-w-xl text-sm"

  const hasAssignments = model.hasVisibleAssignments

  return (
    <div className="space-y-5">
      <section className="mb-6 flex items-start gap-4">
        <div className="space-y-2">
          <h1 className={`${titleSizeClass} font-semibold tracking-tight text-foreground`}>
            Assignments
          </h1>
          <p className={`${subtitleClass} leading-6 text-muted-foreground`}>
            Manage and create assignments for your classes.
          </p>
        </div>
      </section>

      <div className="mt-5 space-y-5">
        {model.feedbackMessage ? (
          <div className="rounded-[24px] border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
            {model.feedbackMessage}
          </div>
        ) : null}

        {model.hasError ? (
          <div className="rounded-[24px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Unable to load assignments right now. Please refresh and try again.
          </div>
        ) : null}

        {model.isLoading ? (
          <div className="rounded-[28px] border border-border bg-card px-5 py-8 text-sm text-muted-foreground shadow-sm">
            Loading assignments and generation history...
          </div>
        ) : null}

        {hasAssignments ? (
          <>
            <AssignmentsToolbar
              filterOptions={model.filterOptions}
              isFilterMenuOpen={model.isFilterMenuOpen}
              onCreateAssignment={model.handleCreateAssignment}
              onFilterMenuToggle={model.handleFilterMenuToggle}
              onFilterSelect={model.handleFilterSelect}
              onSearchChange={model.handleSearchChange}
              searchValue={model.searchValue}
              selectedFilter={model.selectedFilter}
              selectedFilterLabel={model.selectedFilterLabel}
            />

            <AssignmentsGrid
              assignments={model.assignments}
              isGenerating={model.isGenerating}
              onMenuToggle={model.handleAssignmentMenuToggle}
              onRegenerate={model.handleRegenerateAssignment}
              openMenuId={model.openMenuId}
            />
          </>
        ) : (
          !model.isLoading && (
            <AssignmentsEmptyState
              actionLabel={model.emptyState.actionLabel}
              description={model.emptyState.description}
              onAction={model.handleEmptyAction}
              title={model.emptyState.title}
            />
          )
        )}
      </div>
    </div>
  )
}
