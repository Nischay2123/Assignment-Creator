import { Navigate } from "react-router-dom"
import { LoginPage } from "@/pages/LoginPage"
import { OtpPage } from "@/pages/OtpPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { SuccessPage } from "@/pages/SuccessPage"
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute"
import { PublicRoute } from "@/features/auth/components/PublicRoute"
import { useLoginRoute } from "@/features/auth/hooks/useLoginRoute"
import { useOtpRoute } from "@/features/auth/hooks/useOtpRoute"
import { useRegisterRoute } from "@/features/auth/hooks/useRegisterRoute"
import { useSuccessRoute } from "@/features/auth/hooks/useSuccessRoute"
import { useAuthSession } from "@/features/auth/hooks/useAuthSession"

export const RootRedirectRoute = () => {
  const { isLoggedIn } = useAuthSession()

  return <Navigate to={isLoggedIn ? "/assignments" : "/register"} replace />
}

export const RegisterRouteView = () => {
  const { handleRegistrationSuccess, handleGoToLogin } = useRegisterRoute()

  return (
    <PublicRoute>
      <RegisterPage
        onSuccessCallback={handleRegistrationSuccess}
        onLoginClick={handleGoToLogin}
      />
    </PublicRoute>
  )
}

export const OtpRouteView = () => {
  const { email, shouldRedirectToRegister, handleOtpSuccess, handleBackToRegister } = useOtpRoute()

  if (shouldRedirectToRegister) {
    return <Navigate to="/register" replace />
  }

  return (
    <PublicRoute>
      <OtpPage
        email={email}
        onSuccessCallback={handleOtpSuccess}
        onBackCallback={handleBackToRegister}
      />
    </PublicRoute>
  )
}

export const LoginRouteView = () => {
  const { handleLoginSuccess, handleBackToRegister } = useLoginRoute()

  return (
    <PublicRoute>
      <LoginPage
        onSuccessCallback={handleLoginSuccess}
        onBackToRegister={handleBackToRegister}
      />
    </PublicRoute>
  )
}

export const SuccessRouteView = () => {
  const { userName, userEmail, handleLogoutToLogin, handleLogoutToRegister } = useSuccessRoute()

  return (
    <ProtectedRoute>
      <SuccessPage
        userName={userName}
        userEmail={userEmail}
        onGoToLogin={handleLogoutToLogin}
        onBackToRegister={handleLogoutToRegister}
      />
    </ProtectedRoute>
  )
}
