import { validatePassword, PASSWORD_RULES } from "@/shared/lib/validators"

interface UsePasswordValidationReturn {
  rules: typeof PASSWORD_RULES
  validationErrors: string[]
  isValid: boolean
}

export const usePasswordValidation = (password: string): UsePasswordValidationReturn => {
  const validationErrors = validatePassword(password)
  const isValid = validationErrors.length === 0

  return {
    rules: PASSWORD_RULES,
    validationErrors,
    isValid,
  }
}
