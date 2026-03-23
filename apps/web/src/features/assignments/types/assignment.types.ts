export type AssignmentStatus = "active" | "review" | "scheduled"

export type Assignment = {
  id: string
  title: string
  assignedOn: string
  dueOn: string
  status: AssignmentStatus
}

export type AssignmentFilter = "all" | "active" | "review" | "scheduled"
