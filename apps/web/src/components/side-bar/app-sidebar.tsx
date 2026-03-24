import * as React from "react"

import { NavAnalytics } from "@/components/side-bar/nav-liveanalytics"
import { NavUser } from "@/components/side-bar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type NavItem = {
  name: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

type SidebarData = {
  brand: string
  liveAnalytics: NavItem[]
  analytics?: NavItem[]
  user: {
    name: string
    email: string
    avatar?: string
  }
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  data: SidebarData
  handleLogout: () => void | Promise<void>
}

export const AppSidebar = React.memo(function AppSidebar({
  data,
  handleLogout,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row justify-between font-bold text-xl group-data-[state=collapsed]:hidden">
        {data.brand}
        <SidebarTrigger className="-ml-1" />
      </SidebarHeader>

      <div className="hidden justify-center py-2 md:flex group-data-[state=expanded]:hidden">
        <SidebarTrigger />
      </div>

      <SidebarContent>
        <NavAnalytics projects={data.liveAnalytics} title="Operations" />
        {data.analytics && (
          <NavAnalytics projects={data.analytics} title="Analytics" />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser handleLogout={handleLogout} user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
})
