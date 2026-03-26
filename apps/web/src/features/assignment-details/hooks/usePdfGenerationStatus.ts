import { useEffect, useEffectEvent } from "react"
import { io } from "socket.io-client"

import { assignmentApi } from "@/features/assignments/api/assignmentApi"
import { useAppDispatch } from "@/redux/hooks"
import { API_ORIGIN } from "@/redux/apis/baseApi"

const PDF_GENERATION_SOCKET_EVENT = "pdf-generation:update"

export type PdfGenerationSocketEvent = {
  generationId: string
  status: "pending" | "generating" | "completed" | "failed"
  pdfUrl?: string
  error?: string
}

type UsePdfGenerationStatusOptions = {
  enabled?: boolean
  onStatusChange?: (event: PdfGenerationSocketEvent) => void
}

export const usePdfGenerationStatus = ({
  enabled = true,
  onStatusChange,
}: UsePdfGenerationStatusOptions) => {
  const dispatch = useAppDispatch()
  const handleStatusChange = useEffectEvent((event: PdfGenerationSocketEvent) => {
    onStatusChange?.(event)
  })

  useEffect(() => {
    if (!enabled) {
      return
    }

    const socket = io(API_ORIGIN, {
      withCredentials: true,
      transports: ["websocket"],
    })

    socket.on(PDF_GENERATION_SOCKET_EVENT, (event: PdfGenerationSocketEvent) => {
      // Refresh generation data when PDF status changes
      if (event.status === "completed" || event.status === "failed") {
        dispatch(assignmentApi.util.invalidateTags(["Generations"]))
      }

      handleStatusChange(event)
    })

    return () => {
      socket.disconnect()
    }
  }, [dispatch, enabled, handleStatusChange])
}
