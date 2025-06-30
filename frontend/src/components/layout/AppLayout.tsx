"use client"

import { useState } from 'react'
import Sidebar from './sidebar'
import Topbar from './Topbar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = () => setCollapsed(prev => !prev)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onCollapse={toggle} />
      <div className="flex flex-1 flex-col">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
