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
      {/* Header */}
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

      {/* Content */}
      <div className="mt-5 space-y-5">
        {hasAssignments ? (
          <>
            <AssignmentsToolbar
              filterOptions={model.filterOptions}
              isFilterMenuOpen={model.isFilterMenuOpen}
              onFilterMenuToggle={model.handleFilterMenuToggle}
              onFilterSelect={model.handleFilterSelect}
              onSearchChange={model.handleSearchChange}
              searchValue={model.searchValue}
              selectedFilter={model.selectedFilter}
              selectedFilterLabel={model.selectedFilterLabel}
            />

            <AssignmentsGrid
              assignments={model.assignments}
              onDelete={model.handleDeleteAssignment}
              onMenuToggle={model.handleAssignmentMenuToggle}
              openMenuId={model.openMenuId}
            />
          </>
        ) : (
          <AssignmentsEmptyState
            actionLabel={model.emptyState.actionLabel}
            description={model.emptyState.description}
            onAction={model.handleEmptyAction}
            title={model.emptyState.title}
          />
        )}
      </div>
    </div>
  )
}