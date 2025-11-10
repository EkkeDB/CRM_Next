"use client"

import React, { useEffect, useState } from 'react'
import UiGuard from '@/components/security/UiGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock 
} from 'lucide-react'
import { contractsApi } from '@/lib/api-client'
import MultiSelectList from '@/components/ui/multi-select-list'
import type { DashboardStats } from '@/types'
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  TooltipProps,
} from 'recharts'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {title === "Total Value" ? "Combined contract value" : 
           title === "Total Contracts" ? "All contracts in system" :
           title === "Active Contracts" ? "Currently active" : "Awaiting approval"}
        </p>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [years, setYears] = useState<Array<number | string>>([])
  const [yearsOptions, setYearsOptions] = useState<{id:number; name:string}[]>([])
  const [commodities, setCommodities] = useState<{id:number; name:string}[]>([])
  const [selCommodityIds, setSelCommodityIds] = useState<Array<number | string>>([])

  const loadStats = async (yrs: number[], commodityIds: number[]) => {
    setLoading(true)
    try {
      const s = await contractsApi.getDashboardStats({ years: yrs, commodity_ids: commodityIds })
      setStats(s)
      setError(null)
    } catch (e: any) {
      console.error('Failed to load dashboard stats', e)
      setError(e?.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      // Initial stats without filters to learn available years
      try {
        const s = await contractsApi.getDashboardStats()
        setStats(s)
        const avail = (s.available_years || []).map((v:number)=>({ id: v, name: String(v) }))
        if (avail.length) setYearsOptions(avail)
        // default select max year
        const defaultYear = s.available_years && s.available_years.length ? Math.max(...s.available_years) : new Date().getFullYear()
        setYears([defaultYear])
        // Load commodities list
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const res = await fetch(`${base}/api/commodities/?page_size=1000`, { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const list = Array.isArray(json) ? json : (json?.results ?? [])
          setCommodities(list.map((c:any)=>({ id: c.id, name: c.commodity_name_short || c.commodity_name_full })))
        }
        // Now load filtered stats
        await loadStats([defaultYear], [])
      } catch (e) {
        console.error(e)
      }
    }
    init()
  }, [])

  const fmtCurrency = (val: number | string) => {
    const n = typeof val === 'string' ? parseFloat(val) : val
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
  }

  const monthLabel = (iso: string) => {
    try {
      const d = new Date(iso)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}`
    } catch { return iso }
  }

  // Build chart data for stacked bars and per-commodity lines
  const chartData = React.useMemo(() => {
    const vol = (stats as any)?.monthly_volume_breakdown || []
    const avg = (stats as any)?.monthly_avg_price_breakdown || []
    const map = new Map<string, any>()
    vol.forEach((m: any) => {
      const key = monthLabel(m.month)
      const d = map.get(key) || { month: key };
      (m.breakdown || []).forEach((b: any) => { d[b.commodity] = parseFloat(b.volume || 0) })
      map.set(key, d)
    })
    avg.forEach((m: any) => {
      const key = monthLabel(m.month)
      const d = map.get(key) || { month: key };
      (m.breakdown || []).forEach((b: any) => { d[`avg_${b.commodity}`] = parseFloat(b.avg_price || 0) })
      map.set(key, d)
    })
    return Array.from(map.values())
  }, [stats])

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

  const colorMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    ;(stats?.commodities || []).forEach((name: string, idx: number) => {
      map[name] = colors[idx % colors.length]
    })
    return map
  }, [stats])

  if (loading) {
    return <UiGuard token="ui:dashboard"><LoadingSkeleton /></UiGuard>
  }

  return (
    <UiGuard token="ui:dashboard">
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Welcome to your CRM overview
          </p>
        </div>
        <div className="flex items-start gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Years</div>
            <div className="w-44">
              <MultiSelectList options={yearsOptions} selected={years} onChange={(next)=>{
                setYears(next)
                const yrs = next.map(v=>Number(v)).filter(Boolean)
                const ids = selCommodityIds.map(v=>Number(v)).filter(Boolean)
                loadStats(yrs as number[], ids as number[])
              }} height={120} />
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Commodities</div>
            <div className="w-64">
              <MultiSelectList options={commodities} selected={selCommodityIds} onChange={(next)=>{
                setSelCommodityIds(next)
                const yrs = years.map(v=>Number(v)).filter(Boolean)
                const ids = next.map(v=>Number(v)).filter(Boolean)
                loadStats(yrs as number[], ids as number[])
              }} height={120} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          value={stats?.total_contracts ?? 0}
          icon={<FileText className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Total Value"
          value={fmtCurrency(stats?.total_value || 0)}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          title="Active Contracts"
          value={stats?.active_contracts ?? 0}
          icon={<CheckCircle className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          title="Pending Contracts"
          value={stats?.pending_contracts ?? 0}
          icon={<Clock className="h-4 w-4 text-amber-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Monthly Volume & Weighted Avg Price</CardTitle>
            <p className="text-sm text-muted-foreground">Volume (bars, left) and weighted average price (line, right)</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" tickFormatter={(v) => `${Math.round(v)}`} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v)=>fmtCurrency(v)} />
                    <Tooltip content={({ active, payload, label }: any) => {
                      if (!active || !payload || !payload.length) return null
                      // Build per-commodity lines combining volume and avg price
                      const commoditiesList: string[] = stats?.commodities || []
                      const rows: { name: string; vol?: number; avg?: number }[] = []
                      commoditiesList.forEach((name) => {
                        const volEntry = payload.find((p: any) => p.dataKey === name)
                        const avgEntry = payload.find((p: any) => p.dataKey === `avg_${name}`)
                        const v = volEntry ? Number(volEntry.value || 0) : undefined
                        const a = avgEntry ? Number(avgEntry.value || 0) : undefined
                        if (v !== undefined || a !== undefined) rows.push({ name, vol: v, avg: a })
                      })
                      if (!rows.length) return null
                      return (
                        <div className="rounded-md bg-black/80 text-white text-xs px-3 py-2 shadow-lg">
                          <div className="font-semibold mb-1">{label}</div>
                          <div className="space-y-1">
                            {rows.map((r) => {
                              const c = colorMap[r.name] || '#999'
                              const volStr = r.vol !== undefined ? `${Math.round(r.vol)}mt` : '—'
                              const avgStr = r.avg !== undefined ? Number(r.avg).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
                              return (
                                <div key={r.name} className="flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: c }} />
                                  <span>{`${r.name}: ${volStr} @ ${avgStr}`}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }} />
                    {/* Stacked bars for each commodity */}
                    {(stats?.commodities || []).map((name: string) => (
                      <Bar key={`bar-${name}`} yAxisId="left" dataKey={name} stackId="vol" fill={colorMap[name]} />
                    ))}
                    {/* Lines for avg price per commodity */}
                    {(stats?.commodities || []).map((name: string) => (
                      <Line key={`line-${name}`} yAxisId="right" type="monotone" dataKey={`avg_${name}`} stroke={colorMap[name]} strokeWidth={2} dot={false} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Commodity Share</CardTitle>
            <p className="text-sm text-muted-foreground">Share of commodities (by volume)</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {stats && stats.commodity_share && stats.commodity_share.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={stats.commodity_share}
                         dataKey="share"
                         nameKey="commodity"
                         cx="50%" cy="50%" outerRadius={120}>
                      {stats.commodity_share.map((item: any, idx: number) => (
                        <Cell key={idx} fill={colorMap[item.commodity] || colors[idx % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }: any) => {
                      if (!active || !payload || !payload.length) return null
                      const p = payload[0]?.payload || {}
                      const color = colorMap[p.commodity] || '#999'
                      return (
                        <div className="rounded-md bg-black/80 text-white text-xs px-3 py-2 shadow-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                            <span>{p.commodity}</span>
                          </div>
                          <div>volume: {Math.round(Number(p.volume || 0))}mt</div>
                          <div>share: {Number(p.share || 0).toFixed(1)}%</div>
                        </div>
                      )
                    }} />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top lists */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Top Counterparties by Value</CardTitle>
            <p className="text-sm text-muted-foreground">Highest value trading partners</p>
          </CardHeader>
          <CardContent>
            {stats && stats.top_counterparties && stats.top_counterparties.length > 0 ? (
              <ul className="divide-y">
                {stats.top_counterparties.map((c: any, idx: number) => (
                  <li key={idx} className="py-2 flex items-center justify-between">
                    <span className="text-sm text-foreground">{c.counterparty__counterparty_name}</span>
                    <span className="text-sm font-medium">{fmtCurrency(c.total_value || 0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Top Commodities by Volume</CardTitle>
            <p className="text-sm text-muted-foreground">Most traded commodities</p>
          </CardHeader>
          <CardContent>
            {stats && stats.top_commodities && stats.top_commodities.length > 0 ? (
              <ul className="divide-y">
                {stats.top_commodities.map((c: any, idx: number) => (
                  <li key={idx} className="py-2 flex items-center justify-between">
                    <span className="text-sm text-foreground">{c.commodity__commodity_name_short}</span>
                    <span className="text-sm font-medium">{new Intl.NumberFormat('en-US').format(parseFloat(c.total_quantity || 0))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </UiGuard>
  )
}
