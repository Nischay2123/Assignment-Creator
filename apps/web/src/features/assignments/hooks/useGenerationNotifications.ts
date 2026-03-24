import { useEffect, useEffectEvent } from "react"
import { io } from "socket.io-client"

import type { GenerationSocketEvent } from "@/features/assignments/types/assignment.types"
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
  const handleEvent = useEffectEvent(onEvent)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const socket = io(API_ORIGIN, {
      withCredentials: true,
      transports: ["websocket"],
    })

    socket.on(GENERATION_SOCKET_EVENT, handleEvent)

    return () => {
      socket.off(GENERATION_SOCKET_EVENT, handleEvent)
      socket.disconnect()
    }
  }, [enabled, handleEvent])
}
