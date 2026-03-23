import { useMemo } from "react"
import { Navigate, createBrowserRouter } from "react-router-dom"
import {
  LoginRouteView,
  OtpRouteView,
  RegisterRouteView,
  RootRedirectRoute,
} from "@/features/auth/routes/AuthRouteViews"
import { ProtectedAppLayout } from "@/layouts/ProtectedAppLayout"
import { AssignmentsPage } from "@/pages/AssignmentsPage"
import { AssignmentDetailsPage } from "@/pages/AssignmentDetailsPage"
import { GenerateAssignmentPage } from "@/pages/GenerateAssignmentPage"

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
          path: "/",
          element: <ProtectedAppLayout />,
          children: [
            {
              path: "assignments",
              element: <AssignmentsPage />,
            },
            {
              path: "assignments/:assignmentId",
              element: <AssignmentDetailsPage />,
            },
            {
              path: "generate-assignment",
              element: <GenerateAssignmentPage />,
            },
          ],
        },
        {
          path: "*",
          element: <Navigate to="/" replace />,
        },
      ]),
    []
  )
}
