import * as React from "react"
import { LogOut, UserRound } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar?: string
  }
  handleLogout: () => void
}

export const NavUser = React.memo(function NavUser({
  user,
  handleLogout,
}: NavUserProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/30 p-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 rounded-md bg-sidebar-primary/10 p-1.5 text-sidebar-primary">
              <UserRound className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {user.email}
              </p>
            </div>
          </div>

          <SidebarMenu className="mt-3">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="size-4" />
                <span>Log out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
})
