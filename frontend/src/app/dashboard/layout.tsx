"use client"

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col ml-64">
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