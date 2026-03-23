import type {
  AssignmentListItem,
  AssignmentRecord,
  AssignmentStatus,
  GenerationRecord,
} from "@/features/assignments/types/assignment.types"

export const formatAssignmentDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))

const generationPriority = {
  failed: 4,
  processing: 3,
  queued: 2,
  completed: 1,
} as const

const getLatestGeneration = (generations: GenerationRecord[], assignmentId: string) => {
  return generations
    .filter((generation) => generation.assignmentId === assignmentId)
    .sort((left, right) => {
      const timeDifference =
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()

      if (timeDifference !== 0) {
        return timeDifference
      }

      return generationPriority[right.status] - generationPriority[left.status]
    })[0]
}

export const deriveAssignmentStatus = (
  dueDate: string,
  latestGeneration?: GenerationRecord
): AssignmentStatus => {
  if (latestGeneration && latestGeneration.status !== "completed") {
    return "review"
  }

  if (new Date(dueDate).getTime() > Date.now()) {
    return "scheduled"
  }

  return "active"
}

export const toAssignmentListItem = (
  assignment: AssignmentRecord,
  generations: GenerationRecord[]
): AssignmentListItem => {
  const latestGeneration = getLatestGeneration(generations, assignment.id)

  return {
    id: assignment.id,
    title: assignment.title,
    assignedOn: assignment.createdAt,
    dueOn: assignment.dueDate,
    status: deriveAssignmentStatus(assignment.dueDate, latestGeneration),
    latestGenerationLabel: latestGeneration
      ? `Generation v${latestGeneration.version} • ${latestGeneration.status}`
      : "No generations yet",
  }
}
