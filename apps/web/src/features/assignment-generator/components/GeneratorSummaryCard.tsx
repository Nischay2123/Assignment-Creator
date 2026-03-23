import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type GeneratorSummaryCardProps = {
  dueDate: string
  sourceFileName: string
  totalMarks: number
  totalQuestions: number
}

export const GeneratorSummaryCard = ({
  dueDate,
  sourceFileName,
  totalMarks,
  totalQuestions,
}: GeneratorSummaryCardProps) => {
  return (
    <Card className="rounded-[32px] border border-border/70 bg-card/90 py-0 shadow-sm">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-xl font-semibold">Summary</CardTitle>
        <CardDescription>Review the blueprint before we log the generation run.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="rounded-[24px] bg-muted/60 p-4">
          <p className="text-sm text-muted-foreground">Total Questions</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totalQuestions}</p>
        </div>
        <div className="rounded-[24px] bg-muted/60 p-4">
          <p className="text-sm text-muted-foreground">Total Marks</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totalMarks}</p>
        </div>
        <div className="space-y-2 rounded-[24px] border border-dashed border-border p-4">
          <p className="text-sm font-medium text-foreground">Due date</p>
          <p className="text-sm text-muted-foreground">{dueDate || "Choose a due date"}</p>
          <p className="pt-2 text-sm font-medium text-foreground">Source attachment</p>
          <p className="text-sm text-muted-foreground">
            {sourceFileName || "No file attached yet"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
