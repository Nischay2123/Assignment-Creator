import { useRegisterForm } from "../hooks/useRegisterForm"
import { PasswordField } from "@/shared/components/form/PasswordField"
import { InputField } from "@/shared/components/form/InputField"
import { ErrorMessage } from "@/shared/components/form/ErrorMessage"
import { Button } from "@/components/ui/button"

interface RegisterFormProps {
  onSuccessCallback?: (email: string) => void
}

export const RegisterForm = ({ onSuccessCallback }: RegisterFormProps) => {
  const { formState, formErrors, touchedFields, isSubmitting, submitError, submitSuccess, handleInputChange, handleInputBlur, handleSubmit, isSubmitDisabled } = useRegisterForm(onSuccessCallback)

  const getNameError = () => {
    return touchedFields.name ? formErrors.name : ""
  }

  const getEmailError = () => {
    return touchedFields.email ? formErrors.email : ""
  }

  const getPasswordError = () => {
    return touchedFields.password ? formErrors.password : []
  }

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
            Registration initiated! Redirecting to OTP verification...
          </p>
        </div>
      )}

      <InputField
        label="Full Name"
        placeholder="John Doe"
        value={formState.name}
        onChange={(e) => handleInputChange("name", e.target.value)}
        onBlur={() => handleInputBlur("name")}
        error={getNameError()}
        disabled={isSubmitting}
      />

      <InputField
        label="Email"
        type="email"
        placeholder="john@example.com"
        value={formState.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
        onBlur={() => handleInputBlur("email")}
        error={getEmailError()}
        disabled={isSubmitting}
      />

      <PasswordField
        error={getPasswordError().length > 0 ? " " : ""}
        value={formState.password}
        onChange={(e) => handleInputChange("password", e.target.value)}
        onBlur={() => handleInputBlur("password")}
        placeholder="Enter your password"
        disabled={isSubmitting}
      />

      {getPasswordError().length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
          <ul className="space-y-1">
            {getPasswordError().map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">✕</span>
                <span className="text-xs text-destructive">{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitDisabled}
      >
        {isSubmitting ? "Registering..." : "Register"}
      </Button>
    </form>
  )
}
