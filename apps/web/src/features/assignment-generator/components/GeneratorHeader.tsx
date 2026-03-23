export const GeneratorHeader = () => {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Create Assignment
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Set up a new assignment and trigger generation for your students.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="h-1.5 rounded-full bg-foreground/25" />
        <div className="h-1.5 rounded-full bg-foreground" />
      </div>
    </section>
  )
}
