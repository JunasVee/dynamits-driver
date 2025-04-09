"use client"

import {
  Calendar,
  Home,
  Inbox,
  Phone,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarUserProfile } from "@/components/sidebar-user-profile"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Assignments", url: "/assignments", icon: Inbox },
  { title: "History", url: "/history", icon: Calendar },
  { title: "Contact Admin", url: "#", icon: Phone },
  { title: "Settings", url: "#", icon: Settings },
]

export function AppSidebar() {
  const router = useRouter()
  const [user, setUser] = useState<{
    name: string
    email: string
    avatarUrl: string
  } | null>(null)

  useEffect(() => {
    const storedUser = Cookies.get("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogin = () => {
    router.push("/login")
  }

  const handleLogout = () => {
    Cookies.remove("token")
    Cookies.remove("user")
    setUser(null)
    router.push("/login")
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarUserProfile
          name={user?.name}
          email={user?.email}
          avatarUrl={user?.avatarUrl || ""}
          isLoggedIn={!!user}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
