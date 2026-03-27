import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AssignmentsToolbarProps = {
  searchValue: string
  onCreateAssignment: () => void
  onSearchChange: (value: string) => void
}

export const AssignmentsToolbar = ({
  searchValue,
  onCreateAssignment,
  onSearchChange,
}: AssignmentsToolbarProps) => {
  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
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
