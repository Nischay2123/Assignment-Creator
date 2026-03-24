import { useEffect } from "react"

import type { GenerationRecord } from "@/features/assignments/types/assignment.types"
import {
  countGenerationsForAssignment,
  getPendingGenerations,
  resolvePendingGeneration,
} from "@/features/assignments/lib/pending-generations"

type UsePendingGenerationSyncOptions = {
  generations: GenerationRecord[]
  refetchGenerations: () => Promise<unknown>
  enabled?: boolean
}

const POLLING_INTERVAL_MS = 1500

export const usePendingGenerationSync = ({
  generations,
  refetchGenerations,
  enabled = true,
}: UsePendingGenerationSyncOptions) => {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const pendingEntries = getPendingGenerations()

    if (pendingEntries.length === 0) {
      return
    }

    for (const entry of pendingEntries) {
      const currentCount = countGenerationsForAssignment(entry.assignmentId, generations)

      if (currentCount > entry.previousCount) {
        resolvePendingGeneration(entry.assignmentId)
      }
    }

    const remainingEntries = getPendingGenerations()

    if (remainingEntries.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      void refetchGenerations()
    }, POLLING_INTERVAL_MS)

    void refetchGenerations()

    return () => {
      window.clearInterval(intervalId)
    }
  }, [enabled, generations, refetchGenerations])
}
