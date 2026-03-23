import { MoreVerticalIcon } from "lucide-react"

import { formatAssignmentDate } from "@/features/assignments/lib/assignment-utils"
import type { AssignmentListItem } from "@/features/assignments/types/assignment.types"

type AssignmentCardProps = {
  assignment: AssignmentListItem
  isGenerating: boolean
  isMenuOpen: boolean
  onOpenDetails: (assignmentId: string) => void
  onMenuToggle: (assignmentId: string) => void
  onRegenerate: (assignmentId: string) => void
}

const statusClasses = {
  active: "bg-foreground text-background",
  review: "bg-muted text-foreground",
  scheduled: "bg-secondary text-secondary-foreground",
}

export const AssignmentCard = ({
  assignment,
  isGenerating,
  isMenuOpen,
  onOpenDetails,
  onMenuToggle,
  onRegenerate,
}: AssignmentCardProps) => {
  return (
    <article
      className="relative min-h-40 cursor-pointer rounded-[28px] border border-border bg-card p-5 shadow-sm transition hover:shadow-md sm:min-h-44 sm:p-6"
      onClick={() => onOpenDetails(assignment.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpenDetails(assignment.id)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClasses[assignment.status]}`}
          >
            {assignment.status}
          </span>
          <div>
            <h3 className="max-w-[16ch] text-2xl font-semibold leading-tight tracking-tight text-card-foreground underline decoration-1 underline-offset-4 sm:text-[1.95rem]">
              {assignment.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{assignment.latestGenerationLabel}</p>
          </div>
        </div>

        <div className="relative" data-assignments-overlay-root="true">
          <button
            aria-label={`Open actions for ${assignment.title}`}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation()
              onMenuToggle(assignment.id)
            }}
            type="button"
          >
            <MoreVerticalIcon className="size-5" />
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-11 z-20 min-w-44 rounded-[22px] border border-border bg-popover p-2 shadow-xl">
              <button
                className="w-full rounded-2xl px-4 py-3 text-left text-sm text-popover-foreground hover:bg-muted disabled:opacity-50"
                disabled={isGenerating}
                onClick={(event) => {
                  event.stopPropagation()
                  onRegenerate(assignment.id)
                }}
                type="button"
              >
                {isGenerating ? "Regenerating..." : "Generate Again"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground sm:mt-10 sm:text-base">
        <p>
          <span className="font-semibold text-card-foreground">Assigned on : </span>
          {formatAssignmentDate(assignment.assignedOn)}
        </p>
        <p>
          <span className="font-semibold text-card-foreground">Due : </span>
          {formatAssignmentDate(assignment.dueOn)}
        </p>
      </div>
    </article>
  )
}
