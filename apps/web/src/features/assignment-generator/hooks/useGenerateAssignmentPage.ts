import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import {
  useCreateAssignmentMutation,
  useCreateGenerationMutation,
  useGetAssignmentsQuery,
} from "@/features/assignments/api/assignmentApi"
import { createGeneratorSection } from "@/features/assignment-generator/lib/generator-config"
import type {
  GeneratorFormErrors,
  GeneratorSectionFormItem,
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

const toDateInputValue = (value: string) => {
  if (!value) {
    return ""
  }

  return new Date(value).toISOString().split("T")[0]
}

const toSectionFormItems = (
  sections: GeneratorFormState["sections"]
): GeneratorSectionFormItem[] => {
  if (sections.length > 0) {
    return sections
  }

  return [createGeneratorSection("MCQ")]
}

const buildPromptOverrideFromForm = (form: GeneratorFormState) => {
  return JSON.stringify(
    {
      title: form.title.trim(),
      instructions:
        form.additionalInfo.trim() ||
        "Generate a balanced assignment based on the configured sections.",
      dueDate: new Date(form.dueDate).toISOString(),
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
    },
    null,
    2
  )
}

export const useGenerateAssignmentPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedAssignmentId = searchParams.get("assignmentId")
  const didPrefillRef = useRef(false)
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
  const assignmentsQuery = useGetAssignmentsQuery()

  const editingAssignment = useMemo(() => {
    if (!requestedAssignmentId) {
      return null
    }

    return (assignmentsQuery.data ?? []).find(
      (assignment) => assignment.id === requestedAssignmentId
    )
  }, [assignmentsQuery.data, requestedAssignmentId])

  const isEditMode = Boolean(requestedAssignmentId)
  const isHydratingForm = isEditMode && assignmentsQuery.isLoading

  const errors = getFormErrors(form)
  const isSubmitting =
    createAssignmentState.isLoading ||
    createGenerationState.isLoading ||
    isHydratingForm

  useEffect(() => {
    if (!editingAssignment || didPrefillRef.current) {
      return
    }

    setForm({
      title: editingAssignment.title,
      dueDate: toDateInputValue(editingAssignment.dueDate),
      additionalInfo: editingAssignment.instructions,
      sourceFileName:
        editingAssignment.sourceMaterial?.type === "file"
          ? editingAssignment.sourceMaterial.content
          : "",
      sections: toSectionFormItems(
        editingAssignment.sections.map((section, index) => ({
          id: `${section.sectionId}-${index + 1}`,
          label: section.title,
          questionType: section.questionConfig.type,
          difficulty: section.questionConfig.difficulty,
          count: section.questionConfig.count,
          marksPerQuestion: section.questionConfig.marksPerQuestion,
        }))
      ),
    })

    didPrefillRef.current = true
  }, [editingAssignment])

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
      const assignmentId = editingAssignment
        ? editingAssignment.id
        : (
            await createAssignment({
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
          ).id

      const generation = await createGeneration({
        assignmentId,
        promptOverride: isEditMode
          ? buildPromptOverrideFromForm(form)
          : form.additionalInfo.trim() || undefined,
      }).unwrap()

      const successMessage = isEditMode
        ? `Generation v${generation.generation.version} was logged for this assignment.`
        : `Assignment created and generation v${generation.generation.version} was logged successfully.`

      setSubmitSuccess(successMessage)

      window.setTimeout(() => {
        navigate(isEditMode ? `/assignments/${assignmentId}` : "/assignments")
      }, 900)
    } catch (error: any) {
      setSubmitError(error?.data?.message || "Unable to submit assignment right now.")
    }
  }

  return {
    errors,
    form,
    isEditMode,
    isHydratingForm,
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
