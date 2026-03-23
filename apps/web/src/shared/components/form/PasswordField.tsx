import React from "react"
import { Eye, EyeOff } from "lucide-react"
import { useToggle } from "@/shared/hooks/useToggle"
import { InputField } from "./InputField"

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  containerClassName?: string
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = "Password", containerClassName, ...props }, ref) => {
    const [showPassword, toggleShowPassword] = useToggle(false)

    return (
      <div className={containerClassName}>
        <div className="relative">
          <InputField
            ref={ref}
            label={label}
            type={showPassword ? "text" : "password"}
            {...props}
          />

          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    )
  }
)

PasswordField.displayName = "PasswordField"
