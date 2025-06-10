"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  FileText,
  Building,
  Users,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onCollapse: () => void
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/contracts', label: 'Contracts', icon: FileText },
  { href: '/counterparties', label: 'Counterparties', icon: Building },
  { href: '/traders', label: 'Traders', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings }
]

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between px-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          {!collapsed && <span className="text-xl font-bold">NextCRM</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={onCollapse}>
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {menuItems.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted',
                active ? 'bg-muted text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
