"use client"

import React, { useEffect, useMemo, useState } from 'react'
import UiGuard from '@/components/security/UiGuard'
import { rolesApi } from '@/lib/api-client'
import type { Role } from '@/types'

type CatalogAction = { key: string; label: string; token: string }
type CatalogResource = { key: string; label: string; actions: CatalogAction[] }
type Catalog = { resources: CatalogResource[]; action_labels: Record<string, string>; ui_pages?: { key:string; label:string; token:string }[] }

const fetchCatalog = async (): Promise<Catalog> => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const res = await fetch(`${base}/api/auth/authz/catalog/`, { credentials: 'include' })
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`)
  return res.json()
}

export default function RolesMatrixPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [permSet, setPermSet] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId) || null, [roles, selectedRoleId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [r, c] = await Promise.all([rolesApi.getAll(), fetchCatalog()])
        setRoles(r)
        setCatalog(c)
        if (r.length) setSelectedRoleId(r[0].id)
      } catch (e: any) {
        setError(e?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      const perms = Array.isArray(selectedRole.permissions) ? selectedRole.permissions : []
      setPermSet(new Set(perms))
    } else {
      setPermSet(new Set())
    }
  }, [selectedRole])

  const toggleToken = (token: string) => {
    setPermSet(prev => {
      const next = new Set(prev)
      if (next.has(token)) next.delete(token)
      else next.add(token)
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedRole) return
    setSaving(true)
    setError(null)
    try {
      const cleaned = Array.from(permSet).filter(t => !t.startsWith('ui:'))
      const updated = await rolesApi.update(selectedRole.id, { permissions: cleaned })
      setRoles(prev => prev.map(r => (r.id === updated.id ? updated : r)))
    } catch (e: any) {
      setError(e?.message || 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <UiGuard token="ui:roles">
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Roles & Matrix</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 space-y-2">
            <h2 className="font-medium">Roles</h2>
            <ul className="border rounded divide-y">
              {roles.map(r => (
                <li key={r.id} className={`p-2 cursor-pointer ${selectedRoleId===r.id?'bg-gray-100':''}`} onClick={() => setSelectedRoleId(r.id)}>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-600">{r.description || '—'}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Permissions Matrix</h2>
              <div className="space-x-2">
                <button className="bg-gray-200 px-3 py-1 rounded disabled:opacity-60" disabled={!selectedRole} onClick={async ()=>{
                  if (!selectedRole) return
                  const name = `${selectedRole.name} (copy)`
                  try {
                    const created = await rolesApi.create({ name, description: selectedRole.description, permissions: Array.from(permSet), is_active: true as any })
                    setRoles(prev=>[...prev, created])
                    setSelectedRoleId(created.id)
                  } catch (e) {
                    setError('Failed to clone role')
                  }
                }}>Clone</button>
                <button className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-60" disabled={!selectedRole} onClick={async ()=>{
                  if (!selectedRole) return
                  if (!confirm(`Delete role "${selectedRole.name}"?`)) return
                  try {
                    await rolesApi.delete(selectedRole.id)
                    setRoles(prev=>prev.filter(r=>r.id!==selectedRole.id))
                    setSelectedRoleId(roles.length?roles[0].id:null)
                  } catch (e) {
                    setError('Failed to delete role (maybe assigned)')
                  }
                }}>Delete</button>
                <button className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60" onClick={handleSave} disabled={!selectedRole || saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            {!catalog || !selectedRole ? (
              <div className="text-gray-500">Select a role to edit.</div>
            ) : (
              <div className="overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Resource</th>
                      <th className="text-left px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.resources.map(res => (
                      <tr key={res.key} className="border-t">
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{res.label}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-4 flex-wrap">
                            {res.actions.map(a => (
                              <label key={a.key} className="inline-flex items-center gap-2" title={a.usages && a.usages.length ? `Used by: ${a.usages.join(', ')}` : ''}>
                                <input
                                  type="checkbox"
                                  checked={permSet.has(a.token)}
                                  onChange={() => toggleToken(a.token)}
                                />
                                <span>{a.label}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* UI pages access removed: UI visibility is managed per-user on Users & Auth */}
          </div>
        </div>
      )}
    </div>
    </UiGuard>
  )
}

