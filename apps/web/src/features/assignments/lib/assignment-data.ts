import type { AssignmentListItem } from "@/features/assignments/types/assignment.types"

export const assignmentSeedData: AssignmentListItem[] = [
  {
    id: "electricity-quiz",
    title: "Quiz on Electricity",
    assignedOn: "2025-06-20",
    dueOn: "2025-06-21",
    status: "active",
    latestGenerationLabel: "Generation v1 • completed",
  },
  {
    id: "fractions-practice",
    title: "Fractions Practice",
    assignedOn: "2025-06-22",
    dueOn: "2025-06-24",
    status: "review",
    latestGenerationLabel: "Generation v2 • processing",
  },
  {
    id: "ecosystem-reflection",
    title: "Ecosystem Reflection",
    assignedOn: "2025-06-23",
    dueOn: "2025-06-27",
    status: "scheduled",
    latestGenerationLabel: "No generations yet",
  },
  {
    id: "reading-comprehension",
    title: "Reading Comprehension",
    assignedOn: "2025-06-24",
    dueOn: "2025-06-28",
    status: "active",
    latestGenerationLabel: "Generation v1 • completed",
  },
  {
    id: "algebra-revision",
    title: "Algebra Revision",
    assignedOn: "2025-06-25",
    dueOn: "2025-06-30",
    status: "review",
    latestGenerationLabel: "Generation v3 • queued",
  },
  {
    id: "water-cycle-poster",
    title: "Water Cycle Poster",
    assignedOn: "2025-06-26",
    dueOn: "2025-07-01",
    status: "scheduled",
    latestGenerationLabel: "No generations yet",
  },
]
