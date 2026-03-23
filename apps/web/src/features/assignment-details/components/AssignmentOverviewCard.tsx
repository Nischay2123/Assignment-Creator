import type {
  AssignmentInfoItem,
  SectionInfoItem,
} from "@/features/assignment-details/types/assignment-details.types"

type AssignmentOverviewCardProps = {
  infoItems: AssignmentInfoItem[]
  sections: SectionInfoItem[]
}

export const AssignmentOverviewCard = ({
  infoItems,
  sections,
}: AssignmentOverviewCardProps) => {
  return (
    <section className="rounded-3xl border border-border/80 bg-zinc-100 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {infoItems.map((item) => (
          <div key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-sm text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Sections</h2>
        {sections.map((section) => (
          <article className="rounded-2xl border border-border bg-background p-4" key={section.id}>
            <p className="text-sm font-semibold text-foreground">{section.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{section.instruction}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {section.questionType} • {section.questionCount} questions • {section.difficulty} • {section.marksPerQuestion} marks each
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
