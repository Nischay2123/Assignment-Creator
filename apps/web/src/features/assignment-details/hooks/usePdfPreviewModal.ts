import { useState } from "react"

import type { GenerationRecord } from "@/features/assignments/types/assignment.types"

export const usePdfPreviewModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationRecord | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const openModal = (generation: GenerationRecord) => {
    setSelectedGeneration(generation)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setSelectedGeneration(null)
    setIsRegenerating(false)
  }

  const handleRegenerationStart = () => {
    setIsRegenerating(true)
  }

  const handleRegenerationComplete = () => {
    setIsRegenerating(false)
  }

  return {
    isOpen,
    selectedGeneration,
    isRegenerating,
    openModal,
    closeModal,
    handleRegenerationStart,
    handleRegenerationComplete,
  }
}
