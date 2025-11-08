"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { authzApi, rolesApi, roleAssignmentsApi } from '@/lib/api-client'
import type { User, Role, UserRoleAssignment } from '@/types'

// Fallback users api (reuse existing api-client user endpoints if any). Provide a minimal local alias.
// We don't have usersApi in api-client, so implement a thin wrapper here.
const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/users/?page_size=1000`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Failed to load users: ${res.status}`)
  const json = await res.json()
  return Array.isArray(json) ? json : (json?.results ?? [])
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([])
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [newAssignment, setNewAssignment] = useState<{ role: number | ''; constraints: string }>({ role: '', constraints: '{"centers":[],"commodities":[],"date_window":null}' })
  const [simulation, setSimulation] = useState<any | null>(null)
  // Structured constraints inputs
  const [centers, setCenters] = useState<{id:number; name:string}[]>([])
  const [commodities, setCommodities] = useState<{id:number; name:string}[]>([])
  const [selCenters, setSelCenters] = useState<number[]>([])
  const [selCommodities, setSelCommodities] = useState<(number|string)[]>([])
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [monthsBack, setMonthsBack] = useState<string>("")
  const [maxExportRows, setMaxExportRows] = useState<string>("")
  const [visibleFields, setVisibleFields] = useState<string>("")
  const [contractFieldsHint, setContractFieldsHint] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [u, r, a] = await Promise.all([fetchUsers(), rolesApi.getAll(), roleAssignmentsApi.getAll()])
      setUsers(u)
      setRoles(r)
      setAssignments(a)
      if (u.length) setSelectedUser(u[0].id)
      // load centers and commodities for structured constraints
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const [cc, cm, cf] = await Promise.all([
        fetch(`${base}/api/cost-centers/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/commodities/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/contracts/field_catalog/`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({fields:[]})),
      ])
      const ccList = Array.isArray(cc) ? cc : (cc?.results ?? [])
      const cmList = Array.isArray(cm) ? cm : (cm?.results ?? [])
      setCenters(ccList.map((x:any)=>({id:x.id, name:x.cost_center_name})))
      setCommodities(cmList.map((x:any)=>({id:x.id, name:x.commodity_name_short || x.commodity_name_full})))
      if (cf && Array.isArray(cf.fields)) {
        setContractFieldsHint(cf.fields.join(', '))
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const userAssignments = useMemo(() => {
    const list = Array.isArray(assignments) ? assignments : []
    return list.filter(a => a.user === selectedUser)
  }, [assignments, selectedUser])

  const handleAddAssignment = async () => {
    if (!selectedUser || !newAssignment.role) return
    let constraints: any = {}
    // Prefer structured inputs if any are provided; otherwise parse JSON textarea
    const hasStructured = selCenters.length || selCommodities.length || dateFrom || dateTo || monthsBack || maxExportRows || visibleFields
    if (hasStructured) {
      if (selCenters.length) constraints.centers = selCenters
      if (selCommodities.length) constraints.commodities = selCommodities
      if (monthsBack) {
        constraints.date_window = { months_back: Number(monthsBack) }
      } else if (dateFrom || dateTo) {
        constraints.date_window = { ...(dateFrom?{from:dateFrom}:{}) , ...(dateTo?{to:dateTo}:{}) }
      }
      if (maxExportRows) constraints.max_export_rows = Number(maxExportRows)
      if (visibleFields) constraints.visible_fields = visibleFields.split(',').map(s=>s.trim()).filter(Boolean)
    } else {
      try {
        constraints = newAssignment.constraints ? JSON.parse(newAssignment.constraints) : {}
      } catch (e) {
        setError('Constraints must be valid JSON')
        return
      }
    }
    try {
      const created = await roleAssignmentsApi.create({ user: selectedUser, role: Number(newAssignment.role), constraints, is_active: true })
      setAssignments(prev => [...prev, created])
      setNewAssignment({ role: '', constraints: '{"centers":[],"commodities":[],"date_window":null}' })
      setSelCenters([]); setSelCommodities([]); setDateFrom(''); setDateTo(''); setMonthsBack(''); setMaxExportRows(''); setVisibleFields('')
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to create assignment')
    }
  }

  const handleDeleteAssignment = async (id: number) => {
    try {
      await roleAssignmentsApi.delete(id)
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (e: any) {
      setError(e?.message || 'Failed to delete assignment')
    }
  }

  const handleSimulate = async () => {
    if (!selectedUser) return
    try {
      const data = await authzApi.simulate({ user_id: selectedUser })
      setSimulation(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to simulate policy')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Users & Authorization</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <h2 className="font-medium">Users</h2>
            <ul className="border rounded divide-y">
              {users.map(u => (
                <li key={u.id} className={`p-2 cursor-pointer ${selectedUser===u.id?'bg-gray-100':''}`} onClick={() => setSelectedUser(u.id)}>
                  <div className="font-medium flex items-center gap-2">
                    <span>{u.username}</span>
                    {u.is_superuser ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-purple-600 text-white w-4 h-4 text-[10px]" title="Superuser">S</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-1 space-y-4">
            <h2 className="font-medium">Assignments</h2>
            <div className="space-y-2">
              {userAssignments.map(a => (
                <div key={a.id} className="p-2 border rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{a.role_name || roles.find(r=>r.id===a.role)?.name}</div>
                      <div className="text-xs text-gray-600">active: {a.is_active ? 'yes' : 'no'}</div>
                    </div>
                    <button className="text-red-600 text-sm" onClick={() => handleDeleteAssignment(a.id)}>Remove</button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">{JSON.stringify(a.constraints, null, 2)}</pre>
                </div>
              ))}
            </div>
            <div className="p-2 border rounded space-y-2">
              <div className="font-medium">Add Assignment</div>
              <select className="border rounded p-1 w-full" value={newAssignment.role} onChange={e=>setNewAssignment(v=>({...v, role: e.target.value as any}))}>
                <option value="">Select role…</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-600">Centers</div>
                  <select multiple className="border rounded p-1 w-full h-24" value={selCenters.map(String)} onChange={e=>{
                    const opts = Array.from(e.target.selectedOptions).map(o=>Number(o.value)); setSelCenters(opts)
                  }}>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Commodities</div>
                  <select multiple className="border rounded p-1 w-full h-24" value={selCommodities.map(String)} onChange={e=>{
                    const opts = Array.from(e.target.selectedOptions).map(o=>isNaN(Number(o.value))?o.value:Number(o.value)); setSelCommodities(opts)
                  }}>
                    {commodities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Date from</div>
                  <input type="date" className="border rounded p-1 w-full" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Date to</div>
                  <input type="date" className="border rounded p-1 w-full" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Months back</div>
                  <input type="number" min="0" className="border rounded p-1 w-full" value={monthsBack} onChange={e=>setMonthsBack(e.target.value)} placeholder="e.g., 12" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Max export rows</div>
                  <input type="number" min="0" className="border rounded p-1 w-full" value={maxExportRows} onChange={e=>setMaxExportRows(e.target.value)} placeholder="e.g., 5000" />
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <span>Visible fields (comma separated)</span>
                    <span className="relative inline-flex items-center group">
                      <Info className="h-4 w-4 text-gray-600" />
                      <div className="absolute top-full left-0 mt-1 z-50 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg max-w-[36rem] w-max whitespace-pre-wrap">
                        {contractFieldsHint || 'Fields will appear after loading'}
                      </div>
                    </span>
                  </div>
                  <input type="text" className="border rounded p-1 w-full" value={visibleFields} onChange={e=>setVisibleFields(e.target.value)} placeholder="id,contract_number,status,price,quantity" />
                </div>
              </div>
              <div className="text-xs text-gray-500">Or paste raw JSON below (used only if structured inputs are empty)</div>
              <textarea className="border rounded p-2 w-full h-24 font-mono text-xs" value={newAssignment.constraints} onChange={e=>setNewAssignment(v=>({...v, constraints: e.target.value}))} />
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAddAssignment}>Assign</button>
            </div>
          </div>
          <div className="col-span-1 space-y-4">
            <h2 className="font-medium">Simulation</h2>
            <button className="bg-gray-800 text-white px-3 py-1 rounded" onClick={handleSimulate}>Simulate Policy</button>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto min-h-[200px]">{simulation ? JSON.stringify(simulation, null, 2) : 'No simulation yet'}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
