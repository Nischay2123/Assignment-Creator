import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AssignmentEmptyIllustration } from "@/features/assignments/components/AssignmentEmptyIllustration"

type AssignmentsEmptyStateProps = {
  actionLabel: string
  description: string
  title: string
  onAction: () => void
}

export const AssignmentsEmptyState = ({
  actionLabel,
  description,
  onAction,
  title,
}: AssignmentsEmptyStateProps) => {
  return (
    <section className="flex min-h-[56svh] flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <AssignmentEmptyIllustration />
      <div className="mt-4 max-w-xl space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>

      <Button
        className="mt-8 h-12 rounded-full px-6 text-sm font-medium sm:h-13 sm:px-7 sm:text-base"
        onClick={onAction}
        size="lg"
      >
        <PlusIcon className="size-5" />
        {actionLabel}
      </Button>
    </section>
  )
}
