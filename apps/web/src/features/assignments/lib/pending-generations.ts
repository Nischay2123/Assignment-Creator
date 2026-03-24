type PendingGenerationEntry = {
  assignmentId: string
  previousCount: number
}

const STORAGE_KEY = "pending-generation-entries"

const canUseStorage = () => typeof window !== "undefined"

const readEntries = (): PendingGenerationEntry[] => {
  if (!canUseStorage()) {
    return []
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue) as PendingGenerationEntry[]

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(
      (entry) =>
        typeof entry.assignmentId === "string" &&
        typeof entry.previousCount === "number"
    )
  } catch {
    return []
  }
}

const writeEntries = (entries: PendingGenerationEntry[]) => {
  if (!canUseStorage()) {
    return
  }

  if (entries.length === 0) {
    window.sessionStorage.removeItem(STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export const countGenerationsForAssignment = (
  assignmentId: string,
  generationIds: Array<{ assignmentId: string }>
) => {
  return generationIds.filter((generation) => generation.assignmentId === assignmentId).length
}

export const trackPendingGeneration = (
  assignmentId: string,
  previousCount: number
) => {
  const entries = readEntries().filter((entry) => entry.assignmentId !== assignmentId)

  entries.push({
    assignmentId,
    previousCount,
  })

  writeEntries(entries)
}

export const resolvePendingGeneration = (assignmentId: string) => {
  const entries = readEntries().filter((entry) => entry.assignmentId !== assignmentId)
  writeEntries(entries)
}

export const getPendingGenerations = () => readEntries()
