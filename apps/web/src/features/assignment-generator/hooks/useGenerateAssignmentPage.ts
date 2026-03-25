import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import {
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useCreateGenerationMutation,
  useGetAssignmentsQuery,
  useGetGenerationsQuery,
} from "@/features/assignments/api/assignmentApi"
import { createGeneratorSection } from "@/features/assignment-generator/lib/generator-config"
import {
  countGenerationsForAssignment,
  trackPendingGeneration,
} from "@/features/assignments/lib/pending-generations"
import type {
  GeneratorFormErrors,
  GeneratorSectionFormItem,
  GeneratorFormState,
} from "@/features/assignment-generator/types/generator.types"

const getFormErrors = (form: GeneratorFormState): GeneratorFormErrors => {
  const hasInvalidSections =
    form.sections.length === 0 ||
    form.sections.some((section) => !section.instruction.trim())
  const hasSourceContext =
    Boolean(form.sourceFileName.trim()) || Boolean(form.additionalInfo.trim())

  return {
    title: form.title.trim() ? "" : "Assignment title is required.",
    dueDate: form.dueDate ? "" : "Due date is required.",
    assignmentInstruction: form.assignmentInstruction.trim()
      ? ""
      : "Assignment instruction is required.",
    additionalInfo: hasSourceContext
      ? ""
      : "Add either a reference file or additional information.",
    sections: hasInvalidSections
      ? "Add at least one section and provide section instructions."
      : "",
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

export const useGenerateAssignmentPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedAssignmentId = searchParams.get("assignmentId")
  const didPrefillRef = useRef(false)
  const [form, setForm] = useState<GeneratorFormState>({
    title: "",
    dueDate: "",
    assignmentInstruction: "Attempt all questions.",
    additionalInfo: "",
    sourceFile: null,
    sourceFileName: "",
    sections: [createGeneratorSection("MCQ"), createGeneratorSection("SHORT")],
  })
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")

  const [createAssignment, createAssignmentState] = useCreateAssignmentMutation()
  const [updateAssignment, updateAssignmentState] = useUpdateAssignmentMutation()
  const [createGeneration, createGenerationState] = useCreateGenerationMutation()
  const assignmentsQuery = useGetAssignmentsQuery()
  const generationsQuery = useGetGenerationsQuery()

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
    updateAssignmentState.isLoading ||
    createGenerationState.isLoading ||
    isHydratingForm

  useEffect(() => {
    if (!editingAssignment || didPrefillRef.current) {
      return
    }

    setForm({
      title: editingAssignment.title,
      dueDate: toDateInputValue(editingAssignment.dueDate),
      assignmentInstruction: editingAssignment.instructions,
      sourceFile: null, // File objects can't be recreated from API response
      sourceFileName: editingAssignment.sourceMaterial?.file?.fileUrl
        ? editingAssignment.sourceMaterial.file.fileUrl.split("/").pop() || ""
        : "",
      additionalInfo: editingAssignment.sourceMaterial?.text?.content || "",
      sections: toSectionFormItems(
        editingAssignment.sections.map((section, index) => ({
          id: `${section.sectionId}-${index + 1}`,
          label: section.title,
          instruction: section.instruction,
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
    const isLockedEditField =
      isEditMode &&
      field !== "additionalInfo" &&
      field !== "sourceFileName"

    if (isLockedEditField) {
      return
    }

    setForm((current) => ({ ...current, [field]: value }))
    setSubmitError("")
  }

  const updateSection = (
    sectionId: string,
    patch: Partial<GeneratorFormState["sections"][number]>
  ) => {
    if (isEditMode) {
      return
    }

    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    }))
  }

  const addSection = () => {
    if (isEditMode) {
      return
    }

    setForm((current) => ({
      ...current,
      sections: [...current.sections, createGeneratorSection("LONG")],
    }))
  }

  const removeSection = (sectionId: string) => {
    if (isEditMode) {
      return
    }

    setForm((current) => ({
      ...current,
      sections:
        current.sections.length === 1
          ? current.sections
          : current.sections.filter((section) => section.id !== sectionId),
    }))
  }

  const handleFileSelect = (file?: File) => {
    setForm((current) => ({
      ...current,
      sourceFile: file || null,
      sourceFileName: file?.name ?? "",
    }))
    setSubmitError("")
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
      // Build source material with both text and file
      const sourceMaterial: any = {}
      if (form.additionalInfo.trim()) {
        sourceMaterial.text = { content: form.additionalInfo.trim() }
      }
      // Note: file will be sent separately as multipart form data

      const assignmentId = editingAssignment
        ? editingAssignment.id
        : (
            await createAssignment({
              title: form.title.trim(),
              dueDate: new Date(form.dueDate).toISOString(),
              instructions: form.assignmentInstruction.trim(),
              sections: form.sections.map((section, index) => ({
                sectionId: `section-${index + 1}`,
                title: formatSectionLabel(section.label, index),
                instruction: section.instruction.trim(),
                questionConfig: {
                  type: section.questionType,
                  count: section.count,
                  marksPerQuestion: section.marksPerQuestion,
                  difficulty: section.difficulty,
                },
              })),
              sourceMaterial: Object.keys(sourceMaterial).length > 0 ? sourceMaterial : undefined,
              file: form.sourceFile ?? undefined,
            }).unwrap()
          ).id

      // If in edit mode, update the assignment with new additional info/file
      if (isEditMode && editingAssignment) {
        const updateSourceMaterial: any = {}
        if (form.additionalInfo.trim()) {
          updateSourceMaterial.text = { content: form.additionalInfo.trim() }
        }

        await updateAssignment({
          id: assignmentId,
          payload: {
            sourceMaterial: Object.keys(updateSourceMaterial).length > 0 ? updateSourceMaterial : undefined,
            file: form.sourceFile ?? undefined,
          },
        }).unwrap()
      }

      const previousCount = countGenerationsForAssignment(
        assignmentId,
        generationsQuery.data ?? []
      )

      const generation = await createGeneration({
        assignmentId,
      }).unwrap()
      trackPendingGeneration(assignmentId, previousCount)

      const successMessage = isEditMode
        ? generation.message
        : `Assignment created successfully. ${generation.message}`

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
