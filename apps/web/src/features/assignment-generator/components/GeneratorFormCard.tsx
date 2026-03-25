import { CalendarDaysIcon, UploadCloudIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { QuestionTypeEditor } from "@/features/assignment-generator/components/QuestionTypeEditor"
import { useGenerateAssignmentPage } from "@/features/assignment-generator/hooks/useGenerateAssignmentPage"

type GeneratorFormCardProps = {
  model: ReturnType<typeof useGenerateAssignmentPage>
}

export const GeneratorFormCard = ({ model }: GeneratorFormCardProps) => {
  return (
    <Card className="rounded-2xl border border-border/60 bg-muted/30 p-6 shadow-sm backdrop-blur sm:p-7 lg:p-8">
      <form className="space-y-5 sm:space-y-6" onSubmit={model.handleSubmit}>
        <section className="space-y-1.5">
          <h2 className="text-2xl font-semibold text-foreground">Assignment Details</h2>
          <p className="text-sm text-muted-foreground">
            Basic information about your assignment
          </p>
        </section>

        {model.submitError ? <StatusBanner tone="error" value={model.submitError} /> : null}
        {model.submitSuccess ? <StatusBanner tone="success" value={model.submitSuccess} /> : null}
        {model.isHydratingForm ? (
          <StatusBanner tone="success" value="Loading assignment details..." />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assignment Title" error={model.errors.title}>
            <Input
              className="h-11 rounded-xl bg-background px-4 text-sm shadow-sm border border-border focus-visible:ring-2 focus-visible:ring-primary/30"
              disabled={model.isEditMode}
              onChange={(event) => model.updateField("title", event.target.value)}
              placeholder="Mid-term science paper"
              value={model.form.title}
            />
          </Field>

          <Field label="Due Date" error={model.errors.dueDate}>
            <div className="relative">
              <Input
                className="h-11 rounded-xl bg-background px-4 pr-10 text-sm shadow-sm border border-border focus-visible:ring-2 focus-visible:ring-primary/30"
                disabled={model.isEditMode}
                onChange={(event) => model.updateField("dueDate", event.target.value)}
                type="date"
                value={model.form.dueDate}
              />
              <CalendarDaysIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>
        </div>

        <Field
          label="Assignment Instruction"
          error={model.errors.assignmentInstruction}
        >
          <Textarea
            className="min-h-24 rounded-xl bg-background px-4 py-3 text-sm shadow-sm border border-border focus-visible:ring-2 focus-visible:ring-primary/30"
            disabled={model.isEditMode}
            onChange={(event) =>
              model.updateField("assignmentInstruction", event.target.value)
            }
            placeholder="For example: Attempt all questions."
            value={model.form.assignmentInstruction}
          />
        </Field>

        {model.isEditMode ? (
          <StatusBanner
            tone="success"
            value="Edit mode: only Additional Information and Reference File can be changed."
          />
        ) : null}

        <section className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Reference File (Optional)</span>

            <div className={`rounded-2xl border border-dashed border-border/70 bg-background px-6 py-7 text-center transition ${model.isValidatingFile ? "opacity-60 bg-muted/20" : "hover:border-primary/40 hover:bg-muted/40"}`}>
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted/70 sm:size-14">
                <UploadCloudIcon className="size-5 text-foreground sm:size-6" />
              </div>

              <p className="mt-3 text-base font-medium text-foreground sm:mt-4 sm:text-lg">
                Choose a file or drag and drop it here
              </p>

              <p className="mt-1 max-w-md mx-auto text-sm leading-6 text-muted-foreground">
                Upload a file to guide the question paper generation. This can be:
              </p>

              <ul className="mt-2 max-w-md mx-auto text-sm leading-6 text-muted-foreground space-y-1">
                <li>
                  📘 A <strong>source document</strong> (e.g., notes, textbook, syllabus) from which questions will be generated
                </li>
              </ul>

              <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-muted-foreground">
                You can drag and drop your file here or click <strong>Browse Files</strong> to upload.
              </p>

              <label className={`mt-4 sm:mt-5 inline-flex cursor-pointer items-center rounded-xl bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition ${model.isValidatingFile ? "opacity-60 cursor-not-allowed hover:bg-muted" : "hover:bg-muted/80"}`}>
                {model.isValidatingFile ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Browse Files"
                )}
                <input
                  className="hidden"
                  disabled={model.isValidatingFile}
                  onChange={(event) => model.handleFileSelect(event.target.files?.[0])}
                  type="file"
                />
              </label>

              <p className="mt-3 text-sm text-muted-foreground">
                {model.isValidatingFile 
                  ? "Validating file..." 
                  : model.form.sourceFileName || "No file selected"}
              </p>

              {model.fileValidationError && !model.isValidatingFile && (
                <p className="mt-2 text-sm text-red-500 font-medium">
                  ❌ {model.fileValidationError}
                </p>
              )}
            </div>
          </label>
        </section>

        <QuestionTypeEditor
          error={model.errors.sections}
          isLocked={model.isEditMode}
          onAddSection={model.addSection}
          onRemoveSection={model.removeSection}
          onUpdateSection={model.updateSection}
          sections={model.form.sections}
          totalMarks={model.totals.totalMarks}
          totalQuestions={model.totals.totalQuestions}
        />

        <Field label="Additional Information" error={model.errors.additionalInfo} help="Provide instructions or context for question generation (optional)">
          <Textarea
            className="min-h-28 rounded-xl bg-background px-4 py-3 text-sm shadow-sm border border-border focus-visible:ring-2 focus-visible:ring-primary/30"
            onChange={(event) => model.updateField("additionalInfo", event.target.value)}
            placeholder="Generate a question paper for a 3 hour exam with a balanced spread across sections."
            value={model.form.additionalInfo}
          />
        </Field>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <Button
            className="h-11 rounded-xl px-6 text-sm font-medium shadow-sm"
            onClick={() => window.history.back()}
            type="button"
            variant="outline"
          >
            Previous
          </Button>

          <Button
            className="h-11 rounded-xl px-6 text-sm font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 sm:min-w-44"
            disabled={model.isSubmitting}
            type="submit"
          >
            {model.isSubmitting
              ? model.isEditMode
                ? "Updating..."
                : "Creating..."
              : model.isEditMode
                ? "Update & Generate"
                : "Create & Generate"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

type FieldProps = {
  children: React.ReactNode
  error?: string
  label: string
  help?: string
}

const Field = ({ children, error, label, help }: FieldProps) => {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {help ? <span className="block text-xs text-muted-foreground">{help}</span> : null}
      {children}
      {error ? <span className="block text-xs text-destructive pl-1">{error}</span> : null}
    </label>
  )
}

const StatusBanner = ({ tone, value }: { tone: "error" | "success"; value: string }) => {
  const className =
    tone === "error"
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"

  return <div className={`rounded-xl border px-4 py-3 text-sm ${className}`}>{value}</div>
}