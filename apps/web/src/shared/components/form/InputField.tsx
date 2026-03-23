import React from "react"
import { cn } from "@/lib/utils"
import { ErrorMessage } from "./ErrorMessage"

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  description?: string
  containerClassName?: string
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, description, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground",
            "border-border placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            error && "border-destructive focus:ring-destructive/20",
            className
          )}
          {...props}
        />

        {description && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {error && <ErrorMessage message={error} />}
      </div>
    )
  }
)

InputField.displayName = "InputField"
