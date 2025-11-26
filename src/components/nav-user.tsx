"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar"
import { useAuthStore } from '../stores/authStore';
import { Badge } from './ui/badge';
import { ROLE_DESCRIPTIONS } from '@/types/github';

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.login.slice(0, 2).toUpperCase();

  const roleInfo = ROLE_DESCRIPTIONS[user.role] || ROLE_DESCRIPTIONS.guest;
  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'superadmin':
        return 'bg-purple-600 text-white hover:bg-purple-700';
      case 'admin':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'developer':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'guest':
        return 'bg-gray-400 text-white hover:bg-gray-500';
      default:
        return 'bg-gray-400 text-white hover:bg-gray-500';
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="rounded-lg bg-amber-700 text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name || user.login}</span>
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs">@{user.login}</span>
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar_url} alt={user.login} />
                  <AvatarFallback className="rounded-lg bg-amber-700 text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name || user.login}</span>
                  <span className="truncate text-xs">{user.email || `@${user.login}`}</span>
                  <Badge className={`text-xs mt-1 w-fit ${getRoleBadgeColor()}`}>
                    {roleInfo.name}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
