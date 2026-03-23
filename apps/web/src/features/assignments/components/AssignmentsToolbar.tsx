import { ListFilterIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AssignmentFilter } from "@/features/assignments/types/assignment.types"
import { cn } from "@/lib/utils"

type AssignmentsToolbarProps = {
  filterOptions: Array<{ label: string; value: AssignmentFilter }>
  isFilterMenuOpen: boolean
  searchValue: string
  selectedFilter: AssignmentFilter
  selectedFilterLabel: string
  onCreateAssignment: () => void
  onFilterMenuToggle: () => void
  onFilterSelect: (value: AssignmentFilter) => void
  onSearchChange: (value: string) => void
}

export const AssignmentsToolbar = ({
  filterOptions,
  isFilterMenuOpen,
  searchValue,
  selectedFilter,
  selectedFilterLabel,
  onCreateAssignment,
  onFilterMenuToggle,
  onFilterSelect,
  onSearchChange,
}: AssignmentsToolbarProps) => {
  return (
    <section className="grid gap-3 xl:grid-cols-[240px_minmax(0,1fr)_220px]">
      <div className="relative" data-assignments-overlay-root="true">
        <button
          className="flex h-14 w-full items-center gap-3 rounded-[22px] border border-border bg-card px-4 text-left text-muted-foreground shadow-sm transition hover:border-ring/40"
          onClick={onFilterMenuToggle}
          type="button"
        >
          <ListFilterIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{selectedFilterLabel}</span>
        </button>

        {isFilterMenuOpen ? (
          <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 min-w-60 rounded-3xl border border-border bg-popover p-2 shadow-xl">
            {filterOptions.map((option) => (
              <button
                className={cn(
                  "flex w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  selectedFilter === option.value && "bg-muted text-foreground"
                )}
                key={option.value}
                onClick={() => onFilterSelect(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <label className="flex h-14 items-center gap-3 rounded-[22px] border border-border bg-card px-4 shadow-sm">
        <SearchIcon className="size-5 text-muted-foreground" />
        <Input
          className="h-auto border-0 bg-transparent px-0 text-sm text-foreground shadow-none focus-visible:ring-0"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search Assignment"
          value={searchValue}
        />
      </label>

      <Button className="h-14 rounded-[22px]" onClick={onCreateAssignment} size="lg">
        Create Assignment
      </Button>
    </section>
  )
}
