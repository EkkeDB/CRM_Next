"use client"

import React, { useEffect, useMemo, useState } from 'react'
import UiGuard from '@/components/security/UiGuard'
import { Info } from 'lucide-react'
import MultiSelectList from '@/components/ui/multi-select-list'
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
  // Structured constraints inputs
  const [centers, setCenters] = useState<{id:number; name:string}[]>([])
  const [commodities, setCommodities] = useState<{id:number; name:string}[]>([])
  const [commodityGroups, setCommodityGroups] = useState<{id:number; name:string}[]>([])
  const [commodityTypes, setCommodityTypes] = useState<{id:number; name:string}[]>([])
  const [commoditySubtypes, setCommoditySubtypes] = useState<{id:number; name:string}[]>([])
  const [sociedades, setSociedades] = useState<{id:number; name:string}[]>([])
  const [traders, setTraders] = useState<{id:number; name:string}[]>([])
  const [selCenters, setSelCenters] = useState<number[]>([])
  const [selCommodities, setSelCommodities] = useState<(number|string)[]>([])
  const [selGroups, setSelGroups] = useState<number[]>([])
  const [selTypes, setSelTypes] = useState<number[]>([])
  const [selSubtypes, setSelSubtypes] = useState<number[]>([])
  const [selSociedades, setSelSociedades] = useState<number[]>([])
  const [selTraders, setSelTraders] = useState<number[]>([])
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [monthsBack, setMonthsBack] = useState<string>("")
  const [maxExportRows, setMaxExportRows] = useState<string>("")
  const [visibleFields, setVisibleFields] = useState<string>("")
  const [contractFieldsHint, setContractFieldsHint] = useState<string>("")
  const [uiPages, setUiPages] = useState<{key:string; label:string; token:string}[]>([])
  const [selUiPages, setSelUiPages] = useState<string[]>([])
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
      // load reference data for structured constraints
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const [cc, cm, cg, ct, cst, so, tr, cf, catalog] = await Promise.all([
        fetch(`${base}/api/cost-centers/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/commodities/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/commodity-groups/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/commodity-types/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/commodity-subtypes/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/sociedades/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/traders/?page_size=1000`, { credentials: 'include' }).then(r=>r.json()),
        fetch(`${base}/api/contracts/field_catalog/`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({fields:[]})),
        fetch(`${base}/api/auth/authz/catalog/`, { credentials: 'include' }).then(r=>r.json()).catch(()=>({ ui_pages: [] })),
      ])
      const ccList = Array.isArray(cc) ? cc : (cc?.results ?? [])
      const cmList = Array.isArray(cm) ? cm : (cm?.results ?? [])
      const cgList = Array.isArray(cg) ? cg : (cg?.results ?? [])
      const ctList = Array.isArray(ct) ? ct : (ct?.results ?? [])
      const cstList = Array.isArray(cst) ? cst : (cst?.results ?? [])
      const soList = Array.isArray(so) ? so : (so?.results ?? [])
      const trList = Array.isArray(tr) ? tr : (tr?.results ?? [])
      setCenters(ccList.map((x:any)=>({id:x.id, name:x.cost_center_name})))
      setCommodities(cmList.map((x:any)=>({id:x.id, name:x.commodity_name_short || x.commodity_name_full})))
      setCommodityGroups(cgList.map((x:any)=>({id:x.id, name:x.commodity_group_name})))
      setCommodityTypes(ctList.map((x:any)=>({id:x.id, name:x.commodity_type_name})))
      setCommoditySubtypes(cstList.map((x:any)=>({id:x.id, name:x.commodity_subtype_name})))
      setSociedades(soList.map((x:any)=>({id:x.id, name:x.sociedad_name})))
      setTraders(trList.map((x:any)=>({id:x.id, name:x.trader_name})))
      if (cf && Array.isArray(cf.fields)) {
        setContractFieldsHint(cf.fields.join(', '))
      }
      // UI pages
      const uiList = (catalog?.ui_pages || []) as any[]
      setUiPages(uiList)
      // Preselect based on existing assignments constraints (union of ui_pages)
      const uiSelected = new Set<string>()
      (a || []).filter((x:any)=>x.user=== (selectedUser||u[0]?.id)).forEach((as:any) => {
        const pages = (as.constraints || {}).ui_pages
        if (Array.isArray(pages)) pages.forEach((p:string)=> uiSelected.add(p))
      })
      setSelUiPages(Array.from(uiSelected))
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
    const hasStructured = selCenters.length || selCommodities.length || selGroups.length || selTypes.length || selSubtypes.length || selSociedades.length || selTraders.length || dateFrom || dateTo || monthsBack || maxExportRows || visibleFields
    if (hasStructured) {
      if (selCenters.length) constraints.centers = selCenters
      if (selCommodities.length) constraints.commodities = selCommodities
      if (selGroups.length) constraints.commodity_groups = selGroups
      if (selTypes.length) constraints.commodity_types = selTypes
      if (selSubtypes.length) constraints.commodity_subtypes = selSubtypes
      if (selSociedades.length) constraints.sociedades = selSociedades
      if (selTraders.length) constraints.traders = selTraders
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
      setSelCenters([]); setSelCommodities([]); setSelGroups([]); setSelTypes([]); setSelSubtypes([]); setSelSociedades([]); setSelTraders([]); setDateFrom(''); setDateTo(''); setMonthsBack(''); setMaxExportRows(''); setVisibleFields('')
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to create assignment')
    }
  }

  const saveUiPages = async () => {
    if (!selectedUser) return
    try {
      // Find UIOnly role
      let uiRole = roles.find(r => r.name === 'UIOnly')
      if (!uiRole) {
        uiRole = await rolesApi.create({ name: 'UIOnly', description: 'UI pages access holder', permissions: [], is_active: true as any })
        setRoles(prev=>[...prev, uiRole!])
      }
      // Find existing assignment for this role
      const existing = assignments.find(a => a.user === selectedUser && a.role === (uiRole as any).id)
      if (existing) {
        const newConstraints = { ...(existing.constraints || {}), ui_pages: selUiPages }
        const updated = await roleAssignmentsApi.update(existing.id, { constraints: newConstraints })
        setAssignments(prev => prev.map(x => x.id === existing.id ? updated : x))
      } else {
        const created = await roleAssignmentsApi.create({ user: selectedUser, role: (uiRole as any).id, constraints: { ui_pages: selUiPages }, is_active: true })
        setAssignments(prev => [...prev, created])
      }
      setError(null)
    } catch (e:any) {
      setError(e?.message || 'Failed to save UI pages access')
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
    <UiGuard token="ui:users">
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Users & Authorization</h1>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
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
                  <div className="text-xs text-gray-600 mb-1">Centers</div>
                  <MultiSelectList
                    options={centers}
                    selected={selCenters}
                    onChange={(next)=> setSelCenters(next.map(v=>Number(v)))}
                    placeholder="Filter centers…"
                    height={160}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Commodities</div>
                  <MultiSelectList
                    options={commodities}
                    selected={selCommodities}
                    onChange={(next)=> setSelCommodities(next.map(v=>Number(v)))}
                    placeholder="Filter commodities…"
                    height={160}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Commodity Groups</div>
                  <MultiSelectList
                    options={commodityGroups}
                    selected={selGroups}
                    onChange={(next)=> setSelGroups(next.map(v=>Number(v)))}
                    placeholder="Filter groups…"
                    height={160}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Commodity Types</div>
                  <MultiSelectList
                    options={commodityTypes}
                    selected={selTypes}
                    onChange={(next)=> setSelTypes(next.map(v=>Number(v)))}
                    placeholder="Filter types…"
                    height={160}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Commodity Subtypes</div>
                  <MultiSelectList
                    options={commoditySubtypes}
                    selected={selSubtypes}
                    onChange={(next)=> setSelSubtypes(next.map(v=>Number(v)))}
                    placeholder="Filter subtypes…"
                    height={160}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Sociedades</div>
                  <MultiSelectList
                    options={sociedades}
                    selected={selSociedades}
                    onChange={(next)=> setSelSociedades(next.map(v=>Number(v)))}
                    placeholder="Filter sociedades…"
                    height={160}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Traders</div>
                  <MultiSelectList
                    options={traders}
                    selected={selTraders}
                    onChange={(next)=> setSelTraders(next.map(v=>Number(v)))}
                    placeholder="Filter traders…"
                    height={160}
                  />
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-600 mb-1">Date range</div>
                  <div className="flex items-center gap-2">
                    <input type="date" className="border rounded p-1 w-full" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
                    <span className="text-xs text-gray-500">to</span>
                    <input type="date" className="border rounded p-1 w-full" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
                  </div>
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
            <h2 className="font-medium">Active Assignments</h2>
            <div className="space-y-2">
              {userAssignments.map(a => (
                <div key={`summary-${a.id}`} className="p-2 bg-gray-50 border rounded">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.role_name || roles.find(r=>r.id===a.role)?.name}</div>
                    <button className="text-red-600 text-sm" onClick={() => handleDeleteAssignment(a.id)}>Remove</button>
                  </div>
                  {renderConstraintsPretty(a.constraints, { centers, commodities, commodityGroups, commodityTypes, commoditySubtypes, sociedades, traders })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UI Pages Access per user */}
        <div className="mt-6 border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">UI Pages Access</div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-xs border rounded"
                onClick={() => setSelUiPages(uiPages.map(p => p.key))}
                disabled={!uiPages.length}
                title="Select all pages"
              >Select all</button>
              <button
                className="px-2 py-1 text-xs border rounded"
                onClick={() => setSelUiPages([])}
                disabled={!selUiPages.length}
                title="Clear selection"
              >Clear all</button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={saveUiPages}>Save</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {uiPages.map(p => (
              <label key={p.key} className="inline-flex items-center gap-2">
                <input type="checkbox" checked={selUiPages.includes(p.key)} onChange={e=>{
                  const checked = e.target.checked
                  setSelUiPages(prev => {
                    const s = new Set(prev)
                    if (checked) s.add(p.key); else s.delete(p.key)
                    return Array.from(s)
                  })
                }} />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
    </UiGuard>
  )
}

function renderConstraintsPretty(raw: any, refs: any) {
  try {
    const c = raw || {}
    const mapVals = (vals: any[], lookup: {id:number; name:string}[]) => {
      const map = new Map(lookup.map(x=>[String(x.id), x.name]))
      return (vals||[]).map(v => map.get(String(v)) || String(v))
    }
    const sections: { label: string; values: (string|number)[] | undefined }[] = [
      { label: 'Centers', values: c.centers ? mapVals(c.centers, refs.centers) : c.centers_names },
      { label: 'Commodity Groups', values: c.commodity_groups ? mapVals(c.commodity_groups, refs.commodityGroups) : c.commodity_groups_names },
      { label: 'Commodity Types', values: c.commodity_types ? mapVals(c.commodity_types, refs.commodityTypes) : c.commodity_types_names },
      { label: 'Commodity Subtypes', values: c.commodity_subtypes ? mapVals(c.commodity_subtypes, refs.commoditySubtypes) : c.commodity_subtypes_names },
      { label: 'Commodities', values: c.commodities ? mapVals(c.commodities, refs.commodities) : c.commodities_names },
      { label: 'Sociedades', values: c.sociedades ? mapVals(c.sociedades, refs.sociedades) : c.sociedades_names },
      { label: 'Traders', values: c.traders ? mapVals(c.traders, refs.traders) : c.traders_names },
    ]
    return (
      <div className="mt-2 space-y-1 text-xs text-gray-700">
        {sections.filter(s=>s.values && s.values.length).map(s => (
          <div key={s.label}><span className="font-semibold">{s.label}:</span> {(s.values as any).join(', ')}</div>
        ))}
        {c.date_window ? (
          <div><span className="font-semibold">Date window:</span> {c.date_window.months_back ? `last ${c.date_window.months_back} months` : `${c.date_window.from || ''} - ${c.date_window.to || ''}`}</div>
        ) : null}
        {'max_export_rows' in (c||{}) ? (
          <div><span className="font-semibold">Max export rows:</span> {c.max_export_rows ?? 'unlimited'}</div>
        ) : null}
        {c.visible_fields ? (
          <div><span className="font-semibold">Visible fields:</span> {Array.isArray(c.visible_fields) ? c.visible_fields.join(', ') : c.visible_fields}</div>
        ) : null}
      </div>
    )
  } catch {
    return <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">{JSON.stringify(raw, null, 2)}</pre>
  }
}
