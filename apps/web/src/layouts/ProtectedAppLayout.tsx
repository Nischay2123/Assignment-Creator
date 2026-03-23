import { useCallback, useMemo } from "react"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { ClipboardListIcon, WandSparklesIcon } from "lucide-react"

import { AppSidebar } from "@/components/side-bar/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthSession } from "@/features/auth/hooks/useAuthSession"

export const ProtectedAppLayout = () => {
  const { user, isLoggedIn, logout } = useAuthSession()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = useCallback(() => {
    logout()
    navigate("/login")
  }, [logout, navigate])

  const sidebarData = useMemo(
    () => ({
      brand: "Assignment Creator",
      liveAnalytics: [
        { name: "Assignments", url: "/assignments", icon: ClipboardListIcon },
        {
          name: "Generate Assignment",
          url: "/generate-assignment",
          icon: WandSparklesIcon,
        },
      ],
      user: {
        name: user?.name ?? "User",
        email: user?.email ?? "No email available",
        avatar: "",
      },
    }),
    [user?.email, user?.name]
  )

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  const pageTitle = location.pathname.startsWith("/generate-assignment")
    ? "Generate Assignment"
    : location.pathname.startsWith("/assignments/")
      ? "Assignment Details"
      : "Assignments"

  return (
    <SidebarProvider>
      <AppSidebar data={sidebarData} handleLogout={handleLogout} />
      <SidebarInset>
        <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <p className="truncate text-sm font-semibold">{pageTitle}</p>
          </div>
        </header>

        <div className="min-h-svh p-3 sm:p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
