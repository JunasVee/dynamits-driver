"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarUserProfileProps {
  name?: string
  email?: string
  avatarUrl?: string
  isLoggedIn: boolean
  onLogin: () => void
  onLogout: () => void
}

export function SidebarUserProfile({
  name,
  email,
  avatarUrl,
  isLoggedIn,
  onLogin,
  onLogout,
}: SidebarUserProfileProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer w-full">
            <Avatar>
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{name ? name[0] : "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-sm">
                {isLoggedIn ? name : "Guest"}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {isLoggedIn ? email : "Not logged in"}
              </span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {isLoggedIn ? (
            <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onLogin}>Login</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
