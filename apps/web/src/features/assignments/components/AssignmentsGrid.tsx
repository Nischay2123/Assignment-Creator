import { AssignmentCard } from "@/features/assignments/components/AssignmentCard"
import type { Assignment } from "@/features/assignments/types/assignment.types"

type AssignmentsGridProps = {
  assignments: Assignment[]
  openMenuId: string | null
  onDelete: (assignmentId: string) => void
  onMenuToggle: (assignmentId: string) => void
}

export const AssignmentsGrid = ({
  assignments,
  openMenuId,
  onDelete,
  onMenuToggle,
}: AssignmentsGridProps) => {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {assignments.map((assignment) => (
        <AssignmentCard
          assignment={assignment}
          isMenuOpen={openMenuId === assignment.id}
          key={assignment.id}
          onDelete={onDelete}
          onMenuToggle={onMenuToggle}
        />
      ))}
    </section>
  )
}
