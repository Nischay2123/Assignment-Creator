import { useCallback } from "react"
import { useNavigate } from "react-router-dom"

interface UseRegisterRouteReturn {
  handleRegistrationSuccess: (email: string) => void
  handleGoToLogin: () => void
}

export const useRegisterRoute = (): UseRegisterRouteReturn => {
  const navigate = useNavigate()

  const handleRegistrationSuccess = useCallback(
    (email: string) => {
      navigate(`/otp?email=${encodeURIComponent(email)}`)
    },
    [navigate]
  )

  const handleGoToLogin = useCallback(() => {
    navigate("/login")
  }, [navigate])

  return {
    handleRegistrationSuccess,
    handleGoToLogin,
  }
}
