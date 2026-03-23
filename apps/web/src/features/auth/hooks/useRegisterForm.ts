import { useState, useCallback } from "react"
import { validateEmail, validateName } from "@/shared/lib/validators"
import { usePasswordValidation } from "./usePasswordValidation"
import { useRequestOtpMutation } from "../api/authApi"

export interface FormState {
  name: string
  email: string
  password: string
}

export interface FormErrors {
  name: string
  email: string
  password: string[]
}

export interface TouchedFields {
  name: boolean
  email: boolean
  password: boolean
}

interface UseRegisterFormReturn {
  formState: FormState
  formErrors: FormErrors
  touchedFields: TouchedFields
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean
  handleInputChange: (field: keyof FormState, value: string) => void
  handleInputBlur: (field: keyof FormState) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  isSubmitDisabled: boolean
  onSuccessCallback?: (email: string) => void
}

export const useRegisterForm = (onSuccessCallback?: (email: string) => void): UseRegisterFormReturn => {
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  })

  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    name: false,
    email: false,
    password: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [requestOtp, { isLoading: isOtpLoading }] = useRequestOtpMutation()
  const { validationErrors: passwordErrors, isValid: isPasswordValid } = usePasswordValidation(
    formState.password
  )

  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
    setSubmitError(null)
  }, [])

  const handleInputBlur = useCallback((field: keyof FormState) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }))
  }, [])

  const getFormErrors = useCallback((): FormErrors => {
    return {
      name: !validateName(formState.name) ? "Name is required" : "",
      email: !validateEmail(formState.email) ? "Please enter a valid email" : "",
      password: passwordErrors,
    }
  }, [formState.name, formState.email, passwordErrors])

  const isFormValid = useCallback((): boolean => {
    const errors = getFormErrors()
    return (
      validateName(formState.name) &&
      validateEmail(formState.email) &&
      isPasswordValid &&
      errors.password.length === 0
    )
  }, [formState, isPasswordValid, getFormErrors])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setSubmitError(null)

      // Mark all fields as touched on submit
      setTouchedFields({
        name: true,
        email: true,
        password: true,
      })

      if (!isFormValid()) {
        setSubmitError("Please fix all validation errors")
        return
      }

      setIsSubmitting(true)

      try {
        await requestOtp({
          name: formState.name,
          email: formState.email,
          password: formState.password,
        }).unwrap()

        setSubmitSuccess(true)

        // Call callback to navigate to OTP page
        if (onSuccessCallback) {
          setTimeout(() => {
            onSuccessCallback(formState.email)
          }, 500)
        }
      } catch (error: any) {
        const message = error?.data?.message || "Failed to register. Please try again."
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formState, isFormValid, requestOtp, onSuccessCallback]
  )

  const formErrors = getFormErrors()
  const isSubmitDisabled = !isFormValid() || isSubmitting || isOtpLoading

  return {
    formState,
    formErrors,
    touchedFields,
    isSubmitting: isSubmitting || isOtpLoading,
    submitError,
    submitSuccess,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
    isSubmitDisabled,
  }
}
