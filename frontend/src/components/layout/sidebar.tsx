"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  FileText,
  Users,
  Package,
  Settings,
  Home,
  TrendingUp,
  Building,
  Truck,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Contracts',
    href: '/dashboard/contracts',
    icon: FileText,
  },
  {
    title: 'Counterparties',
    href: '/dashboard/counterparties',
    icon: Building,
  },
  {
    title: 'Commodities',
    href: '/dashboard/commodities',
    icon: Package,
  },
  {
    title: 'Traders',
    href: '/dashboard/traders',
    icon: Users,
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: TrendingUp,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-700 px-6">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all"></div>
            <div className="relative bg-primary/10 p-2 rounded-lg border border-primary/20">
              <Truck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              NextCRM
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
              Commodity Trading
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
              )}
              <div className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                isActive 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="relative">{item.title}</span>
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-semibold">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">System Online</span>
          </div>
          <p className="font-semibold">NextCRM v1.0.0</p>
          <p>© 2025 NextCRM</p>
        </div>
      </div>
    </div>
  )
}