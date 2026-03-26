import { AlertCircle, Download, Zap, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import type { GeneratedSection, GenerationRecord } from "@/features/assignments/types/assignment.types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


type PdfPreviewModalProps = {
  generation: GenerationRecord | null
  isOpen: boolean
  isRegenerating: boolean
  onClose: () => void
  onRegenerate: () => void
}

export const PdfPreviewModal = ({
  generation,
  isOpen,
  isRegenerating,
  onClose,
  onRegenerate,
}: PdfPreviewModalProps) => {
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  if (!generation) {
    return null
  }

  const isPdfGenerated = generation.pdfStatus === "generated" && !!generation.pdfUrl

  const handleRegenerateClick = () => {
    setRegenerateError(null)
    onRegenerate()
  }

  // Determine PDF status message
  const getPdfStatusMessage = () => {
    if (isRegenerating) {
      return "Regenerating PDF..."
    }
    if (generation.pdfStatus === "pending") {
      return "Generating PDF..."
    }
    if (generation.pdfStatus === "failed") {
      return "PDF generation failed"
    }
    return null
  }

  const pdfStatusMessage = getPdfStatusMessage()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Assignment Questions - v{generation.version}</span>
            {pdfStatusMessage && (
              <div className={`flex items-center gap-2 text-sm ${
                isRegenerating || generation.pdfStatus === "pending"
                  ? "text-muted-foreground"
                  : "text-destructive"
              }`}>
                {isRegenerating || generation.pdfStatus === "pending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {pdfStatusMessage}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {regenerateError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Failed to regenerate PDF</p>
                <p className="text-xs mt-1">{regenerateError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto bg-muted/30 rounded-lg p-6 space-y-6">
          {generation.result && generation.result.sections && generation.result.sections.length > 0 ? (
            generation.result.sections.map((section: GeneratedSection, sectionIndex: number) => (
              <div key={section.sectionId} className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="font-semibold text-lg">
                    SECTION {String.fromCharCode(65 + sectionIndex)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.instruction}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>Questions: {section.questions.length}</span>
                    <span>
                      Marks:{" "}
                      {section.questions.reduce((acc, q) => acc + q.marks, 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 ml-2">
                  {section.questions.map((question, qIndex: number) => (
                    <div
                      key={`${section.sectionId}-${qIndex}`}
                      className="bg-background rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Q{sectionIndex + 1}.{qIndex + 1}{" "}
                            <span className="font-normal">{question.question}</span>
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          [{question.marks}]
                        </span>
                      </div>

                      {question.type === "MCQ" && question.options && (
                        <div className="ml-4 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <p key={optIndex} className="text-xs text-muted-foreground">
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No questions available for preview
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isRegenerating}
          >
            Close
          </Button>

          {isPdfGenerated && generation.pdfUrl && !isRegenerating ? (
            <a
              href={generation.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1"
            >
              <Button className="w-full" variant="default">
                <Download className="h-4 w-4 mr-2" />
                Open PDF
              </Button>
            </a>
          ) : isPdfGenerated && generation.pdfUrl && isRegenerating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-muted text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Regenerating PDF...</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md ${
                generation.pdfStatus === "failed"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-muted text-muted-foreground"
              }`}>
                {generation.pdfStatus === "failed" ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>PDF generation failed</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleRegenerateClick}
            variant="secondary"
            disabled={isRegenerating || generation.status !== "completed"}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isRegenerating ? "Regenerating..." : "Regenerate PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
