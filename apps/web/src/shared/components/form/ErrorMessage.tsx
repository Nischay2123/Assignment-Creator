import { cn } from "@/lib/utils"

interface ErrorMessageProps {
  message?: string
  className?: string
}

export const ErrorMessage = ({ message, className }: ErrorMessageProps) => {
  if (!message) return null

  return (
    <p className={cn("text-sm text-destructive mt-1", className)}>
      {message}
    </p>
  )
}
