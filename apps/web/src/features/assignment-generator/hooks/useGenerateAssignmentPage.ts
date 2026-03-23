import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  useCreateAssignmentMutation,
  useCreateGenerationMutation,
} from "@/features/assignments/api/assignmentApi"
import { createGeneratorSection } from "@/features/assignment-generator/lib/generator-config"
import type {
  GeneratorFormErrors,
  GeneratorFormState,
} from "@/features/assignment-generator/types/generator.types"

const getFormErrors = (form: GeneratorFormState): GeneratorFormErrors => {
  return {
    title: form.title.trim() ? "" : "Assignment title is required.",
    dueDate: form.dueDate ? "" : "Due date is required.",
    additionalInfo: "",
    sections: form.sections.length > 0 ? "" : "Add at least one question type.",
  }
}

const formatSectionLabel = (label: string, index: number) => {
  return label.trim() || `Section ${index + 1}`
}

export const useGenerateAssignmentPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState<GeneratorFormState>({
    title: "",
    dueDate: "",
    additionalInfo: "",
    sourceFileName: "",
    sections: [createGeneratorSection("MCQ"), createGeneratorSection("SHORT")],
  })
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")

  const [createAssignment, createAssignmentState] = useCreateAssignmentMutation()
  const [createGeneration, createGenerationState] = useCreateGenerationMutation()

  const errors = getFormErrors(form)
  const isSubmitting = createAssignmentState.isLoading || createGenerationState.isLoading

  const totals = useMemo(() => {
    const totalQuestions = form.sections.reduce((sum, section) => sum + section.count, 0)
    const totalMarks = form.sections.reduce(
      (sum, section) => sum + section.count * section.marksPerQuestion,
      0
    )

    return { totalMarks, totalQuestions }
  }, [form.sections])

  const updateField = (field: keyof Omit<GeneratorFormState, "sections">, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSubmitError("")
  }

  const updateSection = (
    sectionId: string,
    patch: Partial<GeneratorFormState["sections"][number]>
  ) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    }))
  }

  const addSection = () => {
    setForm((current) => ({
      ...current,
      sections: [...current.sections, createGeneratorSection("LONG")],
    }))
  }

  const removeSection = (sectionId: string) => {
    setForm((current) => ({
      ...current,
      sections:
        current.sections.length === 1
          ? current.sections
          : current.sections.filter((section) => section.id !== sectionId),
    }))
  }

  const handleFileSelect = (file?: File) => {
    updateField("sourceFileName", file?.name ?? "")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError("")
    setSubmitSuccess("")

    if (Object.values(errors).some(Boolean)) {
      setSubmitError("Please complete the required assignment details before continuing.")
      return
    }

    try {
      const assignment = await createAssignment({
        title: form.title.trim(),
        dueDate: new Date(form.dueDate).toISOString(),
        instructions:
          form.additionalInfo.trim() ||
          "Generate a balanced assignment based on the configured sections.",
        sections: form.sections.map((section, index) => ({
          sectionId: `section-${index + 1}`,
          title: formatSectionLabel(section.label, index),
          instruction: `Create ${section.count} ${section.label.toLowerCase()} with ${section.difficulty} difficulty.`,
          questionConfig: {
            type: section.questionType,
            count: section.count,
            marksPerQuestion: section.marksPerQuestion,
            difficulty: section.difficulty,
          },
        })),
        sourceMaterial: form.sourceFileName
          ? { type: "file", content: form.sourceFileName }
          : undefined,
      }).unwrap()

      const generation = await createGeneration({
        assignmentId: assignment.id,
        promptOverride: form.additionalInfo.trim() || undefined,
      }).unwrap()

      setSubmitSuccess(
        `Assignment created and generation v${generation.generation.version} was logged successfully.`
      )

      window.setTimeout(() => {
        navigate("/assignments")
      }, 900)
    } catch (error: any) {
      setSubmitError(error?.data?.message || "Unable to create assignment right now.")
    }
  }

  return {
    errors,
    form,
    isSubmitting,
    submitError,
    submitSuccess,
    totals,
    addSection,
    handleFileSelect,
    handleSubmit,
    removeSection,
    updateField,
    updateSection,
  }
}
