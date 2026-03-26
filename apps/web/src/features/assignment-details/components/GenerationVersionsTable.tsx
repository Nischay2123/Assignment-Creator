import { Button } from "@/components/ui/button"
import type { GenerationVersionRow } from "@/features/assignment-details/types/assignment-details.types"
import { AlertCircle, Loader2 } from "lucide-react"

type GenerationVersionsTableProps = {
  rows: GenerationVersionRow[]
  onPreviewClick?: (rowId: string) => void
}

export const GenerationVersionsTable = ({ rows, onPreviewClick }: GenerationVersionsTableProps) => {
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
                  {row.pdfLink && row.pdfLabel === "Preview" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="font-medium text-primary hover:underline"
                      onClick={() => onPreviewClick?.(row.id)}
                    >
                      {row.pdfLabel}
                    </Button>
                  ) : row.pdfLabel === "Generating..." ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{row.pdfLabel}</span>
                    </div>
                  ) : row.pdfLabel === "Failed" ? (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{row.pdfLabel}</span>
                    </div>
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
