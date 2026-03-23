import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthSession } from "@/features/auth/hooks/useAuthSession"

interface UseSuccessRouteReturn {
  userName: string
  userEmail: string
  handleLogoutToLogin: () => void
  handleLogoutToRegister: () => void
}

export const useSuccessRoute = (): UseSuccessRouteReturn => {
  const navigate = useNavigate()
  const { user, logout } = useAuthSession()

  const handleLogoutToLogin = useCallback(() => {
    logout()
    navigate("/login")
  }, [logout, navigate])

  const handleLogoutToRegister = useCallback(() => {
    logout()
    navigate("/register")
  }, [logout, navigate])

  return {
    userName: user?.name ?? "User",
    userEmail: user?.email ?? "",
    handleLogoutToLogin,
    handleLogoutToRegister,
  }
}
