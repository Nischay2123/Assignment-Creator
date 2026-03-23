import { CalendarDaysIcon, UploadCloudIcon } from "lucide-react"

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
    <Card className="rounded-[36px] border border-border/70 bg-muted/35 p-5 shadow-sm sm:p-8">
      <form className="space-y-8" onSubmit={model.handleSubmit}>
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Assignment Details</h2>
          <p className="text-sm text-muted-foreground">
            Basic information about your assignment
          </p>
        </section>

        {model.submitError ? <StatusBanner tone="error" value={model.submitError} /> : null}
        {model.submitSuccess ? <StatusBanner tone="success" value={model.submitSuccess} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assignment Title" error={model.errors.title}>
            <Input
              className="h-13 rounded-full bg-background px-4"
              onChange={(event) => model.updateField("title", event.target.value)}
              placeholder="Mid-term science paper"
              value={model.form.title}
            />
          </Field>
          <Field label="Due Date" error={model.errors.dueDate}>
            <div className="relative">
              <Input
                className="h-13 rounded-full bg-background px-4 pr-12"
                onChange={(event) => model.updateField("dueDate", event.target.value)}
                type="date"
                value={model.form.dueDate}
              />
              <CalendarDaysIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>
        </div>

        <section className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Reference File</span>
            <div className="rounded-[32px] border border-dashed border-border bg-background px-6 py-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
                <UploadCloudIcon className="size-6 text-foreground" />
              </div>
              <p className="mt-4 text-lg font-medium text-foreground">
                Choose a file or drag and drop it here
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The UI is ready now. Backend file processing can be added next.
              </p>
              <label className="mt-5 inline-flex cursor-pointer items-center rounded-full bg-muted px-5 py-3 text-sm font-medium text-foreground">
                Browse Files
                <input
                  className="hidden"
                  onChange={(event) => model.handleFileSelect(event.target.files?.[0])}
                  type="file"
                />
              </label>
              <p className="mt-4 text-sm text-muted-foreground">
                {model.form.sourceFileName || "No file selected"}
              </p>
            </div>
          </label>
        </section>

        <QuestionTypeEditor
          onAddSection={model.addSection}
          onRemoveSection={model.removeSection}
          onUpdateSection={model.updateSection}
          sections={model.form.sections}
          totalMarks={model.totals.totalMarks}
          totalQuestions={model.totals.totalQuestions}
        />

        <Field label="Additional Information" error={model.errors.additionalInfo}>
          <Textarea
            className="bg-background"
            onChange={(event) => model.updateField("additionalInfo", event.target.value)}
            placeholder="Generate a question paper for a 3 hour exam with a balanced spread across sections."
            value={model.form.additionalInfo}
          />
        </Field>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            className="h-13 rounded-full px-6"
            onClick={() => window.history.back()}
            type="button"
            variant="outline"
          >
            Previous
          </Button>
          <Button className="h-13 rounded-full px-6" disabled={model.isSubmitting} type="submit">
            {model.isSubmitting ? "Creating..." : "Create & Generate"}
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
}

const Field = ({ children, error, label }: FieldProps) => {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  )
}

const StatusBanner = ({ tone, value }: { tone: "error" | "success"; value: string }) => {
  const className =
    tone === "error"
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"

  return <div className={`rounded-[24px] border px-4 py-3 text-sm ${className}`}>{value}</div>
}
