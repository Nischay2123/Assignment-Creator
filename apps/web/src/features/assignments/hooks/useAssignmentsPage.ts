import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useIsMobile } from "@/hooks/use-mobile"
import { assignmentSeedData } from "@/features/assignments/lib/assignment-data"
import type {
  Assignment,
  AssignmentFilter,
} from "@/features/assignments/types/assignment.types"

const filterOptions: Array<{ label: string; value: AssignmentFilter }> = [
  { label: "All Assignments", value: "all" },
  { label: "Active", value: "active" },
  { label: "In Review", value: "review" },
  { label: "Scheduled", value: "scheduled" },
]

const matchesFilter = (assignment: Assignment, filter: AssignmentFilter) => {
  if (filter === "all") {
    return true
  }

  return assignment.status === filter
}

const matchesSearch = (assignment: Assignment, searchTerm: string) =>
  assignment.title.toLowerCase().includes(searchTerm.trim().toLowerCase())

export const useAssignmentsPage = () => {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [assignments, setAssignments] = useState<Assignment[]>(assignmentSeedData)
  const [searchValue, setSearchValue] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<AssignmentFilter>("all")
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const filteredAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          matchesFilter(assignment, selectedFilter) &&
          matchesSearch(assignment, searchValue)
      ),
    [assignments, searchValue, selectedFilter]
  )

  const hasAssignments = assignments.length > 0
  const hasVisibleAssignments = filteredAssignments.length > 0

  const emptyState = useMemo(() => {
    if (!hasAssignments) {
      return {
        title: "No assignments yet",
        description:
          "Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.",
        actionLabel: "Create Your First Assignment",
        actionVariant: "create" as const,
      }
    }

    return {
      title: "No matching assignments",
      description:
        "Try clearing your search or switching filters to see more assignments from your classes.",
      actionLabel: "Clear Search",
      actionVariant: "clear" as const,
    }
  }, [hasAssignments])

  const selectedFilterLabel = useMemo(
    () =>
      filterOptions.find((option) => option.value === selectedFilter)?.label ??
      "All Assignments",
    [selectedFilter]
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  const handleFilterSelect = useCallback((value: AssignmentFilter) => {
    setSelectedFilter(value)
    setIsFilterMenuOpen(false)
  }, [])

  const handleFilterMenuToggle = useCallback(() => {
    setIsFilterMenuOpen((currentValue) => !currentValue)
    setOpenMenuId(null)
  }, [])

  const handleAssignmentMenuToggle = useCallback((assignmentId: string) => {
    setOpenMenuId((currentValue) =>
      currentValue === assignmentId ? null : assignmentId
    )
    setIsFilterMenuOpen(false)
  }, [])

  const handleMenuClose = useCallback(() => {
    setOpenMenuId(null)
    setIsFilterMenuOpen(false)
  }, [])

  const handleDeleteAssignment = useCallback((assignmentId: string) => {
    setAssignments((currentAssignments) =>
      currentAssignments.filter((assignment) => assignment.id !== assignmentId)
    )
    setOpenMenuId(null)
  }, [])

  const handleCreateAssignment = useCallback(() => {
    navigate("/generate-assignment")
  }, [navigate])

  const handleClearSearch = useCallback(() => {
    setSearchValue("")
    setSelectedFilter("all")
  }, [])

  const handleEmptyAction = useCallback(() => {
    if (emptyState.actionVariant === "create") {
      handleCreateAssignment()
      return
    }

    handleClearSearch()
  }, [emptyState.actionVariant, handleClearSearch, handleCreateAssignment])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      if (target.closest("[data-assignments-overlay-root='true']")) {
        return
      }

      handleMenuClose()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [handleMenuClose])

  return {
    assignments: filteredAssignments,
    emptyState,
    hasAssignments,
    hasVisibleAssignments,
    isFilterMenuOpen,
    isMobile,
    openMenuId,
    searchValue,
    selectedFilter,
    selectedFilterLabel,
    filterOptions,
    handleAssignmentMenuToggle,
    handleCreateAssignment,
    handleDeleteAssignment,
    handleEmptyAction,
    handleFilterMenuToggle,
    handleFilterSelect,
    handleMenuClose,
    handleSearchChange,
  }
}
