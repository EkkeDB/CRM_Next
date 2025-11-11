"use client"

import { useEffect, useState } from 'react'
import { authzApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'

// Cache perms per user id to avoid leaking a previous user's perms
const cachedPermsByUser: Record<string, string[] | null> = {}
const inFlightByUser: Record<string, Promise<string[] | null> | null> = {}

export function useUiPerms() {
  const { user } = useAuth()
  const key = user?.id ? String(user.id) : 'anon'
  const [perms, setPerms] = useState<string[] | null>(cachedPermsByUser[key] ?? null)
  const [loading, setLoading] = useState<boolean>(!(key in cachedPermsByUser))

  useEffect(() => {
    const k = user?.id ? String(user.id) : 'anon'
    // If we have cached perms for this user, use them
    if (k in cachedPermsByUser && cachedPermsByUser[k] !== null) {
      setPerms(cachedPermsByUser[k])
      setLoading(false)
      return
    }
    // Kick off a request if not already in flight for this user
    if (!inFlightByUser[k]) {
      inFlightByUser[k] = authzApi.simulate()
        .then((res: any) => {
          const p = (res?.policy?.permissions || []) as string[]
          cachedPermsByUser[k] = p
          return p
        })
        .catch(() => null)
    }
    inFlightByUser[k]!.then((p) => {
      setPerms(p)
      setLoading(false)
    })
  }, [user?.id])

  const isSuper = !!user?.is_superuser
  const has = (token: string) => isSuper || (perms ? perms.includes(token) : false)

  return { loading, perms: perms || [], has, isSuper }
}
