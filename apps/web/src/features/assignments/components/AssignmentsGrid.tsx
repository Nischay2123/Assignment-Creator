import { AssignmentCard } from "@/features/assignments/components/AssignmentCard"
import type { AssignmentListItem } from "@/features/assignments/types/assignment.types"

type AssignmentsGridProps = {
  assignments: AssignmentListItem[]
  isGenerating: boolean
  openMenuId: string | null
  onMenuToggle: (assignmentId: string) => void
  onRegenerate: (assignmentId: string) => void
}

export const AssignmentsGrid = ({
  assignments,
  isGenerating,
  openMenuId,
  onMenuToggle,
  onRegenerate,
}: AssignmentsGridProps) => {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {assignments.map((assignment) => (
        <AssignmentCard
          assignment={assignment}
          isGenerating={isGenerating}
          isMenuOpen={openMenuId === assignment.id}
          key={assignment.id}
          onMenuToggle={onMenuToggle}
          onRegenerate={onRegenerate}
        />
      ))}
    </section>
  )
}
