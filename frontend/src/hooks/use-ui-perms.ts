"use client"

import { useEffect, useState } from 'react'
import { authzApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'

let cachedPerms: string[] | null = null
let inFlight: Promise<string[] | null> | null = null

export function useUiPerms() {
  const { user } = useAuth()
  const [perms, setPerms] = useState<string[] | null>(cachedPerms)
  const [loading, setLoading] = useState(!cachedPerms)

  useEffect(() => {
    if (cachedPerms) return
    if (!inFlight) {
      inFlight = authzApi.simulate().then((res: any) => {
        const p = (res?.policy?.permissions || []) as string[]
        cachedPerms = p
        return p
      }).catch(() => null)
    }
    inFlight.then((p) => { setPerms(p); setLoading(false) })
  }, [])

  const isSuper = !!user?.is_superuser
  const has = (token: string) => isSuper || !token || (perms ? perms.includes(token) : false)

  return { loading, perms: perms || [], has, isSuper }
}

