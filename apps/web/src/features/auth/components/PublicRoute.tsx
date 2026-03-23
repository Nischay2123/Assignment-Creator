import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuthSession } from "@/features/auth/hooks/useAuthSession"

type PublicRouteProps = {
  children: ReactNode
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isLoggedIn } = useAuthSession()

  if (isLoggedIn) {
    return <Navigate to="/success" replace />
  }

  return <>{children}</>
}
