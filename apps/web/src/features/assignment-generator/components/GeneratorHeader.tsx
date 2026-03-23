type GeneratorHeaderProps = {
  isEditMode: boolean
}

export const GeneratorHeader = ({ isEditMode }: GeneratorHeaderProps) => {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {isEditMode ? "Edit Assignment" : "Create Assignment"}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {isEditMode
            ? "Update assignment details and generate a new version."
            : "Set up a new assignment and trigger generation for your students."}
        </p>
      </div>
    </section>
  )
}
