import { useCallback, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

interface UseOtpRouteReturn {
  email: string
  shouldRedirectToRegister: boolean
  handleOtpSuccess: () => void
  handleBackToRegister: () => void
}

export const useOtpRoute = (): UseOtpRouteReturn => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams])

  const handleOtpSuccess = useCallback(() => {
    navigate("/success")
  }, [navigate])

  const handleBackToRegister = useCallback(() => {
    navigate("/register")
  }, [navigate])

  return {
    email,
    shouldRedirectToRegister: email.length === 0,
    handleOtpSuccess,
    handleBackToRegister,
  }
}
