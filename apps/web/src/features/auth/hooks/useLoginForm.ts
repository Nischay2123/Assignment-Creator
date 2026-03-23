import { useCallback, useMemo, useState } from "react"
import { validateEmail } from "@/shared/lib/validators"
import { useLoginMutation } from "../api/authApi"
import { setAuthenticatedUser, setAuthToken } from "@/features/auth/lib/authStorage"

interface LoginState {
  email: string
  password: string
}

interface LoginErrors {
  email: string
  password: string
}

interface LoginTouchedFields {
  email: boolean
  password: boolean
}

interface UseLoginFormReturn {
  formState: LoginState
  formErrors: LoginErrors
  touchedFields: LoginTouchedFields
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean
  handleInputChange: (field: keyof LoginState, value: string) => void
  handleInputBlur: (field: keyof LoginState) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  isSubmitDisabled: boolean
}

export const useLoginForm = (onSuccessCallback?: () => void): UseLoginFormReturn => {
  const [formState, setFormState] = useState<LoginState>({
    email: "",
    password: "",
  })
  const [touchedFields, setTouchedFields] = useState<LoginTouchedFields>({
    email: false,
    password: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [login, { isLoading: isLoginLoading }] = useLoginMutation()

  const formErrors = useMemo<LoginErrors>(() => {
    return {
      email: validateEmail(formState.email) ? "" : "Please enter a valid email",
      password: formState.password.trim().length > 0 ? "" : "Password is required",
    }
  }, [formState.email, formState.password])

  const isFormValid = formErrors.email.length === 0 && formErrors.password.length === 0

  const handleInputChange = useCallback((field: keyof LoginState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
    setSubmitError(null)
  }, [])

  const handleInputBlur = useCallback((field: keyof LoginState) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setSubmitError(null)
      setTouchedFields({ email: true, password: true })

      if (!isFormValid) {
        setSubmitError("Please fix all validation errors")
        return
      }

      setIsSubmitting(true)

      try {
        const result = await login(formState).unwrap()
        setAuthenticatedUser(result.user)
        setAuthToken(result.token)
        setSubmitSuccess(true)

        if (onSuccessCallback) {
          setTimeout(() => {
            onSuccessCallback()
          }, 350)
        }
      } catch (error: any) {
        const message = error?.data?.message || "Login failed. Please try again."
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formState, isFormValid, login, onSuccessCallback]
  )

  return {
    formState,
    formErrors,
    touchedFields,
    isSubmitting: isSubmitting || isLoginLoading,
    submitError,
    submitSuccess,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
    isSubmitDisabled: !isFormValid || isSubmitting || isLoginLoading,
  }
}