import { useMemo } from "react"
import { Navigate, createBrowserRouter } from "react-router-dom"
import {
  LoginRouteView,
  OtpRouteView,
  RegisterRouteView,
  RootRedirectRoute,
  SuccessRouteView,
} from "@/features/auth/routes/AuthRouteViews"

export const useAppRouter = () => {
  return useMemo(
    () =>
      createBrowserRouter([
        {
          path: "/",
          element: <RootRedirectRoute />,
        },
        {
          path: "/register",
          element: <RegisterRouteView />,
        },
        {
          path: "/otp",
          element: <OtpRouteView />,
        },
        {
          path: "/login",
          element: <LoginRouteView />,
        },
        {
          path: "/success",
          element: <SuccessRouteView />,
        },
        {
          path: "*",
          element: <Navigate to="/" replace />,
        },
      ]),
    []
  )
}
