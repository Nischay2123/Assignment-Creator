import { useCallback, useState } from "react"

export type AuthPage = "register" | "otp" | "success" | "login"

interface UseAuthFlowReturn {
  currentPage: AuthPage
  registrationEmail: string
  handleRegistrationSuccess: (email: string) => void
  handleOtpSuccess: () => void
  handleBackToRegister: () => void
  handleGoToRegister: () => void
  handleGoToLogin: () => void
}

export const useAuthFlow = (): UseAuthFlowReturn => {
  const [currentPage, setCurrentPage] = useState<AuthPage>("register")
  const [registrationEmail, setRegistrationEmail] = useState("")

  const handleRegistrationSuccess = useCallback((email: string) => {
    setRegistrationEmail(email)
    setCurrentPage("otp")
  }, [])

  const handleOtpSuccess = useCallback(() => {
    setCurrentPage("success")
  }, [])

  const handleBackToRegister = useCallback(() => {
    setRegistrationEmail("")
    setCurrentPage("register")
  }, [])

  const handleGoToRegister = useCallback(() => {
    setRegistrationEmail("")
    setCurrentPage("register")
  }, [])

  const handleGoToLogin = useCallback(() => {
    setCurrentPage("login")
  }, [])

  return {
    currentPage,
    registrationEmail,
    handleRegistrationSuccess,
    handleOtpSuccess,
    handleBackToRegister,
    handleGoToRegister,
    handleGoToLogin,
  }
}