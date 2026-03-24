import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import {
  useCreateGenerationMutation,
  useGetAssignmentsQuery,
  useGetGenerationsQuery,
} from "@/features/assignments/api/assignmentApi"
import { useGenerationNotifications } from "@/features/assignments/hooks/useGenerationNotifications"
import { formatAssignmentDate } from "@/features/assignments/lib/assignment-utils"
import {
  getAssignmentById,
  sortGenerationRows,
  toSectionInfoItems,
  type AssignmentDetailsViewModel,
} from "@/features/assignment-details/types/assignment-details.types"

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export const useAssignmentDetailsPage = (): AssignmentDetailsViewModel => {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const [feedbackMessage, setFeedbackMessage] = useState("")

  const assignmentsQuery = useGetAssignmentsQuery()
  const generationsQuery = useGetGenerationsQuery()
  const [createGeneration, createGenerationState] = useCreateGenerationMutation()

  const assignment = useMemo(() => {
    if (!assignmentId) {
      return null
    }

    return getAssignmentById(assignmentsQuery.data ?? [], assignmentId)
  }, [assignmentId, assignmentsQuery.data])

  const generationRows = useMemo(() => {
    if (!assignment) {
      return []
    }

    return sortGenerationRows(generationsQuery.data ?? [])
      .filter((generation) => generation.assignmentId === assignment.id)
      .map((generation) => ({
        id: generation.id,
        versionLabel: `v${generation.version}`,
        statusLabel: generation.status,
        createdOnLabel: formatDateTime(generation.createdAt),
        pdfLink: generation.pdfUrl ?? null,
        pdfLabel: generation.pdfUrl ? "Open PDF" : "Not generated",
      }))
  }, [assignment, generationsQuery.data])

  const infoItems = useMemo(() => {
    if (!assignment) {
      return []
    }

    return [
      { label: "Due date", value: formatAssignmentDate(assignment.dueDate) },
      { label: "Created on", value: formatAssignmentDate(assignment.createdAt) },
      { label: "Instructions", value: assignment.instructions || "No instructions" },
      { label: "Total sections", value: `${assignment.sections.length}` },
    ]
  }, [assignment])

  const sections = useMemo(() => {
    if (!assignment) {
      return []
    }

    return toSectionInfoItems(assignment.sections)
  }, [assignment])

  const onGenerate = async () => {
    if (!assignment) {
      return
    }

    setFeedbackMessage("")

    try {
      const result = await createGeneration({ assignmentId: assignment.id }).unwrap()
      setFeedbackMessage(result.message)
    } catch (error: any) {
      setFeedbackMessage(error?.data?.message || "Unable to generate right now.")
    }
  }

  const onEdit = () => {
    if (!assignment) {
      return
    }

    navigate(`/generate-assignment?assignmentId=${assignment.id}`)
  }

  const onBack = () => {
    navigate("/assignments")
  }

  const onRefetch = async () => {
    await Promise.all([assignmentsQuery.refetch(), generationsQuery.refetch()])
  }

  useGenerationNotifications({
    enabled: Boolean(assignmentId),
    onEvent: (event) => {
      if (!assignmentId || event.assignmentId !== assignmentId) {
        return
      }

      generationsQuery.refetch()

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

  useEffect(() => {
    setFeedbackMessage("")
  }, [assignmentId])

  const isLoading = assignmentsQuery.isLoading || generationsQuery.isLoading
  const isRefetching = assignmentsQuery.isFetching || generationsQuery.isFetching
  const hasError = Boolean(assignmentsQuery.error || generationsQuery.error)

  return {
    assignmentTitle: assignment?.title ?? "Assignment",
    feedbackMessage,
    isGenerating: createGenerationState.isLoading,
    isLoading,
    isNotFound: !isLoading && !assignment,
    isRefetching,
    hasError,
    infoItems,
    sections,
    generationRows,
    onBack,
    onGenerate,
    onEdit,
    onRefetch,
  }
}
