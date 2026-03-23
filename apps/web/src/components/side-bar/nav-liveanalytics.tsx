import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  name: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

type NavAnalyticsProps = {
  projects: NavItem[]
  title?: string
}

export const NavAnalytics = React.memo(function NavAnalytics({
  projects,
  title = "",
}: NavAnalyticsProps) {
  const location = useLocation()

  const isItemActive = React.useCallback(
    (url: string) => {
      const normalizePath = (value: string) => {
        const normalized = String(value).replace(/\/+$/, "")
        return normalized || "/"
      }

      const currentPath = normalizePath(location.pathname)
      const itemPath = normalizePath(url)

      return (
        currentPath === itemPath ||
        (itemPath !== "/" && currentPath.startsWith(`${itemPath}/`))
      )
    },
    [location.pathname]
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const Icon = item.icon

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                isActive={isItemActive(item.url)}
                render={<Link to={item.url} />}
              >
                <Icon />
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
})
