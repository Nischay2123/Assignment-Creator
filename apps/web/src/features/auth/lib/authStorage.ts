import type { AuthUser } from "@/features/auth/types/auth.types"

const AUTH_USER_KEY = "auth_user"
const AUTH_TOKEN_KEY = "auth_token"

export const setAuthenticatedUser = (user: AuthUser): void => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const getAuthenticatedUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem(AUTH_USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export const isAuthenticated = (): boolean => {
  return Boolean(getAuthenticatedUser())
}

export const clearAuthSession = (): void => {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
