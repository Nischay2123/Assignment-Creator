import { FileTextIcon, SearchXIcon } from "lucide-react"

export const AssignmentEmptyIllustration = () => {
  return (
    <div className="relative mx-auto flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
      <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_top,#ffffff_0%,#f1f1f1_42%,#dbdbdb_100%)] shadow-[0_30px_80px_rgba(255,255,255,0.1)]" />
      <div className="absolute left-0 top-12 h-10 w-10 rounded-full border border-sky-400/70" />
      <div className="absolute bottom-7 left-4 h-4 w-4 rotate-12 rounded-sm border border-sky-400/70" />
      <div className="absolute right-1 top-9 flex h-11 w-18 items-center gap-2 rounded-2xl bg-white px-3 shadow-lg shadow-black/10 sm:w-20">
        <span className="h-3 w-3 rounded-full bg-violet-200" />
        <span className="h-3 w-8 rounded-full bg-neutral-300" />
      </div>
      <div className="absolute flex h-40 w-28 flex-col rounded-[28px] bg-white px-5 py-6 shadow-2xl shadow-black/10">
        <FileTextIcon className="mb-5 size-8 text-slate-900" />
        <span className="mb-3 h-2 rounded-full bg-neutral-300" />
        <span className="mb-3 h-2 rounded-full bg-neutral-200" />
        <span className="mb-3 h-2 rounded-full bg-neutral-200" />
        <span className="h-2 w-4/5 rounded-full bg-neutral-200" />
      </div>
      <div className="absolute right-7 top-16 flex size-24 items-center justify-center rounded-full border-8 border-violet-200 bg-white/75 shadow-[0_12px_40px_rgba(0,0,0,0.14)] backdrop-blur-sm sm:size-28">
        <SearchXIcon className="size-11 text-rose-500 sm:size-14" strokeWidth={3.2} />
      </div>
      <div className="absolute bottom-4 right-5 h-20 w-5 rotate-[-42deg] rounded-full bg-violet-200 sm:h-24" />
    </div>
  )
}
