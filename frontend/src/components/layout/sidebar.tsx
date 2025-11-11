"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useUiPerms } from '@/hooks/use-ui-perms'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  FileText,
  Building,
  Users,
  BarChart2,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck,
  Contact,
  DollarSign,
  Briefcase,
  Package,
  Layers,
  Globe,
  ShoppingCart,
  Plus,
  Building2,
  Shuffle
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onCollapse: () => void
}

const baseMenuSections = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Home },
      { href: '/dashboard/geo', label: 'Geo Heatmap', icon: Globe },
    ]
  },
  {
    title: 'Trading',
    items: [
      { href: '/dashboard/contracts', label: 'Contracts', icon: FileText },
      { href: '/dashboard/counterparties', label: 'Counterparties', icon: Building },
    ]
  },
  {
    title: 'Reference Data',
    items: [
      { href: '/dashboard/currencies', label: 'Currencies', icon: DollarSign },
      { href: '/dashboard/cost-centers', label: 'Cost Centers', icon: Briefcase },
      { href: '/dashboard/sociedades', label: 'Sociedades', icon: Building2 },
      { href: '/dashboard/trade-operation-types', label: 'Trade Operations', icon: Shuffle },
      { href: '/dashboard/counterparties/factories', label: 'Factories', icon: Building2 },
      { href: '/dashboard/traders', label: 'Traders', icon: Users },
      { href: '/dashboard/contacts', label: 'Contacts', icon: Contact },
    ]
  },
  {
    title: 'Commodities',
    items: [
      { href: '/dashboard/commodity-groups', label: 'Commodity Groups', icon: Layers },
      { href: '/dashboard/commodity-types', label: 'Commodity Types', icon: Package },
      { href: '/dashboard/commodity-subtypes', label: 'Commodity Subtypes', icon: Package },
      { href: '/dashboard/commodities', label: 'Commodities', icon: ShoppingCart },
    ]
  },
  {
    title: 'Trade Settings',
    items: [
      { href: '/dashboard/icoterms', label: 'ICOTERMS', icon: Globe },
      { href: '/dashboard/delivery-formats', label: 'Delivery Formats', icon: Truck },
      { href: '/dashboard/additives', label: 'Additives', icon: Plus },
    ]
  },
  {
    title: 'System',
    items: [
      { href: '/dashboard/reports', label: 'Reports', icon: BarChart2 },
      { href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
      { href: '/dashboard/admin/users', label: 'Users & Auth', icon: Users },
      { href: '/dashboard/admin/roles', label: 'Roles Matrix', icon: Users }
    ]
  }
]

const routeToToken: Record<string, string> = {
  '/dashboard': 'ui:dashboard',
  '/dashboard/contracts': 'ui:contracts',
  '/dashboard/counterparties': 'ui:counterparties',
  '/dashboard/counterparties/factories': 'ui:factories',
  '/dashboard/traders': 'ui:traders',
  '/dashboard/contacts': 'ui:contacts',
  '/dashboard/currencies': 'ui:currencies',
  '/dashboard/cost-centers': 'ui:cost_centers',
  '/dashboard/sociedades': 'ui:sociedades',
  '/dashboard/trade-operation-types': 'ui:trade_operations',
  '/dashboard/reports': 'ui:reports',
  '/dashboard/analytics': 'ui:analytics',
  '/dashboard/geo': 'ui:analytics',
  '/dashboard/commodity-groups': 'ui:commodity_groups',
  '/dashboard/commodity-types': 'ui:commodity_types',
  '/dashboard/commodity-subtypes': 'ui:commodity_subtypes',
  '/dashboard/commodities': 'ui:commodities',
  '/dashboard/icoterms': 'ui:icoterms',
  '/dashboard/delivery-formats': 'ui:delivery_formats',
  '/dashboard/additives': 'ui:additives',
  '/dashboard/analytics': 'ui:analytics',
  '/dashboard/admin/roles': 'ui:roles',
  '/dashboard/admin/users': 'ui:users',
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { loading: permsLoading, has, isSuper } = useUiPerms()

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
      <nav className="flex-1 space-y-2 px-2 py-4">
        {baseMenuSections.map((section, sectionIndex) => {
          const filteredItems = section.items.filter(item => {
            const token = routeToToken[item.href] || ''
            if (isSuper) return true
            if (permsLoading) return false
            return token ? has(token) : false
          })
          if (filteredItems.length === 0) return null
          return (
            <div key={section.title} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              {collapsed && sectionIndex > 0 && (
                <div className="my-2 border-t border-border" />
              )}
              {filteredItems.map(item => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors',
                      active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}



