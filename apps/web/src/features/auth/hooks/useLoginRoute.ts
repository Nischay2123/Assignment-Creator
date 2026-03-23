import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

interface UseLoginRouteReturn {
  handleLoginSuccess: () => void
  handleBackToRegister: () => void
}

export const useLoginRoute = (): UseLoginRouteReturn => {
  const navigate = useNavigate()

  const handleLoginSuccess = useCallback(() => {
    navigate("/success")
  }, [navigate])

  const handleBackToRegister = useCallback(() => {
    navigate("/register")
  }, [navigate])

  return {
    handleLoginSuccess,
    handleBackToRegister,
  }
}
