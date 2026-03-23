import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuthSession } from "@/features/auth/hooks/useAuthSession"

type ProtectedRouteProps = {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn } = useAuthSession()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
