"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  ChevronDown,
  ChevronUp,
  Truck,
  Package,
  Layers,
  Tags,
  DollarSign,
  Plus,
  TrendingUp,
  UserCheck,
  CreditCard,
  Shield,
  Briefcase,
  BarChart3,
  Factory,
  FolderOpen,
  ShoppingCart,
  Cog,
  UsersIcon
} from 'lucide-react'

interface MenuItem {
  href: string
  label: string
  icon: any
}

interface MenuSection {
  id: string
  label: string
  icon: any
  items: MenuItem[]
}

interface SidebarProps {
  collapsed: boolean
  onCollapse: () => void
}

// Main navigation items (non-admin)
const mainMenuItems: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/contracts', label: 'Contracts', icon: FileText },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart2 }
]

// Admin sections with subsections
const adminSections: MenuSection[] = [
  {
    id: 'customers',
    label: 'Customers',
    icon: ShoppingCart,
    items: [
      { href: '/dashboard/counterparties', label: 'Counterparties', icon: Building },
      { href: '/dashboard/counterparty-facilities', label: 'Counterparty Facilities', icon: Factory },
      { href: '/dashboard/contacts', label: 'Contacts', icon: UserCheck }
    ]
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    items: [
      { href: '/dashboard/commodities', label: 'Commodities', icon: Package },
      { href: '/dashboard/commodity-groups', label: 'Commodity Groups', icon: Layers },
      { href: '/dashboard/commodity-types', label: 'Commodity Types', icon: Tags },
      { href: '/dashboard/commodity-subtypes', label: 'Commodity Subtypes', icon: Tags }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Cog,
    items: [
      { href: '/dashboard/sociedades', label: 'Sociedades', icon: Briefcase },
      { href: '/dashboard/cost-centers', label: 'Cost Centers', icon: CreditCard },
      { href: '/dashboard/delivery-formats', label: 'Delivery Formats', icon: Truck },
      { href: '/dashboard/icoterms', label: 'Incoterms', icon: Shield },
      { href: '/dashboard/trade-operation-types', label: 'Trade Operations', icon: TrendingUp },
      { href: '/dashboard/currencies', label: 'Currencies', icon: DollarSign },
      { href: '/dashboard/additives', label: 'Additives', icon: Plus }
    ]
  },
  {
    id: 'users',
    label: 'Users',
    icon: UsersIcon,
    items: [
      { href: '/dashboard/traders', label: 'Traders', icon: Users },
      { href: '/dashboard/admin/users', label: 'User Management', icon: Shield }
    ]
  }
]

// Settings item (always at bottom)
const settingsItem: MenuItem = { href: '/dashboard/settings', label: 'Settings', icon: Settings }

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['customers']))

  const toggleSection = (sectionId: string) => {
    if (collapsed) return
    if (expandedSections.has(sectionId)) {
      // Collapse all if clicking the already open section
      setExpandedSections(new Set())
    } else {
      // Open only this section and close all others
      setExpandedSections(new Set([sectionId]))
    }
  }

  const isItemActive = (href: string) => pathname === href
  const isSectionActive = (section: MenuSection) => 
    section.items.some(item => pathname === item.href)

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
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

      {/* Navigation */}
      <nav className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          {/* Main Menu Items */}
          <div className="space-y-1 mb-4">
            {mainMenuItems.map(item => {
              const active = isItemActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>

          {/* Divider */}
          {!collapsed && <hr className="border-border mb-4" />}

          {/* Admin Section Header */}
          {!collapsed && (
            <div className="mb-3">
              <div className="flex items-center gap-2 px-3 py-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </div>
          )}

          {/* Admin Sections */}
          <div className="space-y-1 mb-4">
            {adminSections.map(section => {
              const isExpanded = expandedSections.has(section.id)
              const sectionActive = isSectionActive(section)
              const SectionIcon = section.icon

              return (
                <div key={section.id}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-full group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors',
                      sectionActive ? 'bg-muted/50 text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <SectionIcon className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{section.label}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>

                  {/* Section Items */}
                  {!collapsed && isExpanded && (
                    <div className="ml-6 space-y-1 mt-1">
                      {section.items.map(item => {
                        const active = isItemActive(item.href)
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors',
                              active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Settings at Bottom */}
          <div className="border-t border-border pt-4 mt-4">
            <Link
              href={settingsItem.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors',
                isItemActive(settingsItem.href) ? 'bg-muted text-foreground' : 'text-muted-foreground'
              )}
            >
              <Settings className="h-5 w-5" />
              {!collapsed && <span>{settingsItem.label}</span>}
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  )
}