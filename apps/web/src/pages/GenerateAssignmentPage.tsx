import { Card } from "@/components/ui/card"

export const GenerateAssignmentPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Generate Assignment
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a new assignment with your generator workflow here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <p className="text-sm text-muted-foreground">Generator inputs and prompts can be placed here.</p>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">Preview and generation status can be shown here.</p>
        </Card>
      </div>
    </div>
  )
}
