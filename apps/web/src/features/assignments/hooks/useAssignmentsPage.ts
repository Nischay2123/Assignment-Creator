import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  useCreateGenerationMutation,
  useGetAssignmentsQuery,
  useGetGenerationsQuery,
} from "@/features/assignments/api/assignmentApi"
import { useGenerationNotifications } from "@/features/assignments/hooks/useGenerationNotifications"
import { usePendingGenerationSync } from "@/features/assignments/hooks/usePendingGenerationSync"
import {
  countGenerationsForAssignment,
  trackPendingGeneration,
} from "@/features/assignments/lib/pending-generations"
import { useIsMobile } from "@/hooks/use-mobile"
import { toAssignmentListItem } from "@/features/assignments/lib/assignment-utils"
import type { AssignmentListItem } from "@/features/assignments/types/assignment.types"

const matchesSearch = (assignment: AssignmentListItem, searchTerm: string) =>
  assignment.title.toLowerCase().includes(searchTerm.trim().toLowerCase())

export const useAssignmentsPage = () => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [searchValue, setSearchValue] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState("")

  const assignmentsQuery = useGetAssignmentsQuery()
  const generationsQuery = useGetGenerationsQuery()
  const [createGeneration, createGenerationState] = useCreateGenerationMutation()

  const assignments = useMemo(() => {
    const assignmentRecords = assignmentsQuery.data ?? []
    const generationRecords = generationsQuery.data ?? []

    return assignmentRecords.map((assignment) =>
      toAssignmentListItem(assignment, generationRecords)
    )
  }, [assignmentsQuery.data, generationsQuery.data])

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => matchesSearch(assignment, searchValue))
  }, [assignments, searchValue])

  const hasAssignments = assignments.length > 0
  const hasVisibleAssignments = filteredAssignments.length > 0

  const emptyState = useMemo(() => {
    if (!hasAssignments) {
      return {
        title: "No assignments yet",
        description:
          "Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.",
        actionLabel: "Create Your First Assignment",
        actionVariant: "create" as const,
      }
    }

    return {
      title: "No matching assignments",
      description: "Try clearing your search to see more assignments from your classes.",
      actionLabel: "Clear Search",
      actionVariant: "clear" as const,
    }
  }, [hasAssignments])

  const isLoading = assignmentsQuery.isLoading || generationsQuery.isLoading
  const hasError = Boolean(assignmentsQuery.error || generationsQuery.error)

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
  }

  const handleAssignmentMenuToggle = (assignmentId: string) => {
    setOpenMenuId((currentValue) =>
      currentValue === assignmentId ? null : assignmentId
    )
  }

  const handleMenuClose = () => {
    setOpenMenuId(null)
  }

  const handleCreateAssignment = () => {
    navigate("/generate-assignment")
  }

  const handleOpenAssignmentDetails = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`)
  }

  const handleClearSearch = () => {
    setSearchValue("")
  }

  const handleEmptyAction = () => {
    if (emptyState.actionVariant === "create") {
      handleCreateAssignment()
      return
    }

    handleClearSearch()
  }

  const handleRegenerateAssignment = async (assignmentId: string) => {
    setFeedbackMessage("")

    try {
      const previousCount = countGenerationsForAssignment(
        assignmentId,
        generationsQuery.data ?? []
      )
      const result = await createGeneration({ assignmentId }).unwrap()
      trackPendingGeneration(assignmentId, previousCount)
      setFeedbackMessage(result.message)
      setOpenMenuId(null)
    } catch (error: any) {
      setFeedbackMessage(error?.data?.message || "Unable to regenerate assignment.")
    }
  }

  useGenerationNotifications({
    onEvent: (event) => {
      if (event.status === "completed") {
        setFeedbackMessage("Generation completed successfully.")
        return
      }

      if (event.status === "failed") {
        setFeedbackMessage(event.error || "Generation failed.")
        return
      }

      setFeedbackMessage("Generation is processing.")
    },
  })

  usePendingGenerationSync({
    generations: generationsQuery.data ?? [],
    refetchGenerations: generationsQuery.refetch,
  })

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      if (target.closest("[data-assignments-overlay-root='true']")) {
        return
      }

      handleMenuClose()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [handleMenuClose])

  return {
    assignments: filteredAssignments,
    emptyState,
    feedbackMessage,
    hasError,
    hasAssignments,
    hasVisibleAssignments,
    isGenerating: createGenerationState.isLoading,
    isLoading,
    isMobile,
    openMenuId,
    searchValue,
    handleAssignmentMenuToggle,
    handleCreateAssignment,
    handleEmptyAction,
    handleMenuClose,
    handleOpenAssignmentDetails,
    handleRegenerateAssignment,
    handleSearchChange,
  }
}
