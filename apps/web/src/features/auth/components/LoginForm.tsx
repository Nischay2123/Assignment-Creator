import { Button } from "@/components/ui/button"
import { ErrorMessage } from "@/shared/components/form/ErrorMessage"
import { InputField } from "@/shared/components/form/InputField"
import { PasswordField } from "@/shared/components/form/PasswordField"
import { useLoginForm } from "../hooks/useLoginForm"

interface LoginFormProps {
  onSuccessCallback?: () => void
}

export const LoginForm = ({ onSuccessCallback }: LoginFormProps) => {
  const {
    formState,
    formErrors,
    touchedFields,
    isSubmitting,
    submitError,
    submitSuccess,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
    isSubmitDisabled,
  } = useLoginForm(onSuccessCallback)

  const emailError = touchedFields.email ? formErrors.email : ""
  const passwordError = touchedFields.password ? formErrors.password : ""

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <ErrorMessage message={submitError} />
        </div>
      )}

      {submitSuccess && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-600 dark:text-green-400">
            Login successful! Redirecting...
          </p>
        </div>
      )}

      <InputField
        label="Email"
        type="email"
        placeholder="john@example.com"
        value={formState.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
        onBlur={() => handleInputBlur("email")}
        error={emailError}
        disabled={isSubmitting}
      />

      <PasswordField
        value={formState.password}
        onChange={(e) => handleInputChange("password", e.target.value)}
        onBlur={() => handleInputBlur("password")}
        error={passwordError}
        placeholder="Enter your password"
        disabled={isSubmitting}
      />

      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}