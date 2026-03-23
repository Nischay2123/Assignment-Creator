import type { GenerationVersionRow } from "@/features/assignment-details/types/assignment-details.types"

type GenerationVersionsTableProps = {
  rows: GenerationVersionRow[]
}

export const GenerationVersionsTable = ({ rows }: GenerationVersionsTableProps) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created On</th>
              <th className="px-4 py-3 font-medium">PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-border" key={row.id}>
                <td className="px-4 py-3 font-medium text-foreground">{row.versionLabel}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{row.statusLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.createdOnLabel}</td>
                <td className="px-4 py-3">
                  {row.pdfLink ? (
                    <a
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      href={row.pdfLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {row.pdfLabel}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{row.pdfLabel}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
