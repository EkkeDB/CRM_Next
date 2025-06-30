"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  const toggleSidebar = () => setCollapsed(prev => !prev)

  // Delay auth check to prevent race conditions on fresh login
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setHasCheckedAuth(true)
      }, 500) // Increased delay to 500ms to let auth state settle properly
      
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  // Show loading spinner while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="ml-4 text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  // Redirect to login if not authenticated (only after auth check delay)
  if (!isAuthenticated && hasCheckedAuth) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <div className={`fixed inset-y-0 left-0 z-50 bg-card border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <Sidebar collapsed={collapsed} onCollapse={toggleSidebar} />
      </div>
      <div className={`flex flex-1 flex-col transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="sticky top-0 z-40 bg-background border-b">
          <Header />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}