import type { AuthUser } from "@/features/auth/types/auth.types"
import {
  clearAuthSession,
  getAuthenticatedUser,
  isAuthenticated,
  setAuthenticatedUser,
} from "@/features/auth/lib/authStorage"

interface UseAuthSessionReturn {
  user: AuthUser | null
  isLoggedIn: boolean
  saveUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthSession = (): UseAuthSessionReturn => {
  const user = getAuthenticatedUser()

  return {
    user,
    isLoggedIn: isAuthenticated(),
    saveUser: setAuthenticatedUser,
    logout: clearAuthSession,
  }
}
