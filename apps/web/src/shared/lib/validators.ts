// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length > 0
}

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
} as const

// Validate password and return array of error messages
export const validatePassword = (password: string): string[] => {
  const errors: string[] = []

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`)
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Must include at least one uppercase letter")
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Must include at least one lowercase letter")
  }

  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push("Must include at least one number")
  }

  return errors
}

export const isPasswordValid = (password: string): boolean => {
  return validatePassword(password).length === 0
}
