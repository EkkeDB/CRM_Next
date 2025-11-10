"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUiPerms } from '@/hooks/use-ui-perms'

export default function UiGuard({ token, children }: { token: string; children: React.ReactNode }) {
  const router = useRouter()
  const { loading, has } = useUiPerms()

  useEffect(() => {
    if (!loading && token && !has(token)) {
      router.replace('/dashboard/not-authorized')
    }
  }, [loading, has, token, router])

  if (loading) return null
  if (token && !has(token)) return null
  return <>{children}</>
}

