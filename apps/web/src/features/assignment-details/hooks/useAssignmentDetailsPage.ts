import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import {
  useCreateGenerationMutation,
  useGetAssignmentsQuery,
  useGetGenerationsQuery,
  useRegeneratePdfMutation,
} from "@/features/assignments/api/assignmentApi"
import { API_ORIGIN } from "@/redux/apis/baseApi"
import { useGenerationNotifications } from "@/features/assignments/hooks/useGenerationNotifications"
import { usePendingGenerationSync } from "@/features/assignments/hooks/usePendingGenerationSync"
import { usePdfGenerationStatus } from "@/features/assignment-details/hooks/usePdfGenerationStatus"
import {
  countGenerationsForAssignment,
  trackPendingGeneration,
} from "@/features/assignments/lib/pending-generations"
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
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null)
  const [isPdfRegenerating, setIsPdfRegenerating] = useState(false)

  const assignmentsQuery = useGetAssignmentsQuery()
  const generationsQuery = useGetGenerationsQuery()
  const [createGeneration, createGenerationState] = useCreateGenerationMutation()
  const [regeneratePdf, regeneratePdfState] = useRegeneratePdfMutation()

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
      .map((generation) => {
        let pdfLabel = "Not generated"
        if (generation.pdfStatus === "pending") {
          pdfLabel = "Generating..."
        } else if (generation.pdfStatus === "generated") {
          pdfLabel = "Preview"
        } else if (generation.pdfStatus === "failed") {
          pdfLabel = "Failed"
        }
        
        return {
          id: generation.id,
          versionLabel: `v${generation.version}`,
          statusLabel: generation.status,
          createdOnLabel: formatDateTime(generation.createdAt),
          pdfLink:
            generation.pdfStatus === "generated"
              ? `${API_ORIGIN}/api/generations/${generation.id}/pdf`
              : null,
          pdfLabel,
        }
      })
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
      const previousCount = countGenerationsForAssignment(
        assignment.id,
        generationsQuery.data ?? []
      )
      const result = await createGeneration({ assignmentId: assignment.id }).unwrap()
      trackPendingGeneration(assignment.id, previousCount)
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
    enabled: Boolean(assignmentId),
    generations: generationsQuery.data ?? [],
    refetchGenerations: generationsQuery.refetch,
  })

  usePdfGenerationStatus({
    enabled: Boolean(assignmentId),
    onStatusChange: (event) => {
      // Handle PDF generation status updates
      if (event.status === "failed") {
        // Error will be shown in modal
      } else if (event.status === "completed") {
        // Auto-refresh generations to get updated PDF URL
        generationsQuery.refetch()
      }
    },
  })

  // Handle PDF regeneration state updates
  useEffect(() => {
    if (regeneratePdfState.isLoading) {
      setIsPdfRegenerating(true)
    } else {
      setIsPdfRegenerating(false)
    }
  }, [regeneratePdfState.isLoading])

  const onPreviewClick = (generationId: string) => {
    const generation = (generationsQuery.data ?? []).find((g) => g.id === generationId)
    if (generation) {
      setSelectedGeneration(generation)
      setIsPdfModalOpen(true)
    }
  }

  const onClosePdfModal = () => {
    setIsPdfModalOpen(false)
    setSelectedGeneration(null)
  }

  const onShowRegenerateConfirm = () => {
    setIsRegenerateConfirmOpen(true)
  }

  const onCancelRegenerate = () => {
    setIsRegenerateConfirmOpen(false)
  }

  const onConfirmRegenerate = async () => {
    if (!selectedGeneration) {
      return
    }

    try {
      await regeneratePdf({ generationId: selectedGeneration.id }).unwrap()
      setIsRegenerateConfirmOpen(false)
    } catch (error: any) {
      // Error will be displayed in the modal via socket events
      console.error("PDF regeneration error:", error)
    }
  }

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
    isPdfModalOpen,
    isPdfRegenerating,
    isRegenerateConfirmOpen,
    selectedGeneration,
    infoItems,
    sections,
    generationRows,
    onBack,
    onGenerate,
    onEdit,
    onRefetch,
    onPreviewClick,
    onClosePdfModal,
    onShowRegenerateConfirm,
    onCancelRegenerate,
    onConfirmRegenerate,
  }
}
