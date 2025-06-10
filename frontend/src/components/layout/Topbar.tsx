"use client"

import { Bell, Menu, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuth, useLogout } from '@/hooks/use-auth'
import { getInitials } from '@/lib/utils'

interface TopbarProps {
  onMenuToggle?: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useAuth()
  const logout = useLogout()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
      {onMenuToggle && (
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" />
      </div>
      <div className="ml-auto flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user?.username || ''} />
                <AvatarFallback>{getInitials(user?.username || 'U')}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout.mutate()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
