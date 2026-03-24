import { useEffect, useEffectEvent } from "react"
import { io } from "socket.io-client"

import { assignmentApi } from "@/features/assignments/api/assignmentApi"
import type { GenerationSocketEvent } from "@/features/assignments/types/assignment.types"
import { useAppDispatch } from "@/redux/hooks"
import { API_ORIGIN } from "@/redux/apis/baseApi"

const GENERATION_SOCKET_EVENT = "generation:update"

type UseGenerationNotificationsOptions = {
  enabled?: boolean
  onEvent: (event: GenerationSocketEvent) => void
}

export const useGenerationNotifications = ({
  enabled = true,
  onEvent,
}: UseGenerationNotificationsOptions) => {
  const dispatch = useAppDispatch()
  const handleEvent = useEffectEvent(onEvent)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const socket = io(API_ORIGIN, {
      withCredentials: true,
      transports: ["websocket"],
    })

    socket.on(GENERATION_SOCKET_EVENT, (event: GenerationSocketEvent) => {
      const generation = event.generation

      if (generation) {
        dispatch(
          assignmentApi.util.updateQueryData("getGenerations", undefined, (draft) => {
            const existingGenerationIndex = draft.findIndex(
              (currentGeneration) => currentGeneration.id === generation.id
            )

            if (existingGenerationIndex === -1) {
              draft.unshift(generation)
              return
            }

            draft[existingGenerationIndex] = generation
          })
        )
      }

      handleEvent(event)
    })

    return () => {
      socket.disconnect()
    }
  }, [dispatch, enabled, handleEvent])
}
