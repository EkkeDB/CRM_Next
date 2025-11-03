"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock 
} from 'lucide-react'
import { contractsApi } from '@/lib/api-client'
import type { DashboardStats } from '@/types'
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const s = await contractsApi.getDashboardStats()
        setStats(s)
        setError(null)
      } catch (e: any) {
        console.error('Failed to load dashboard stats', e)
        setError(e?.message || 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    load()
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

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
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
        <div className="flex items-center space-x-2 bg-card border rounded-lg px-3 py-2 shadow-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString('en-US', { timeZone: 'UTC' })}
          </span>
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
            <CardTitle className="text-lg font-semibold">Monthly Contract Values</CardTitle>
            <p className="text-sm text-muted-foreground">Contract values over the last 12 months</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {stats && stats.monthly_contract_values && stats.monthly_contract_values.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={stats.monthly_contract_values.map((m: any) => ({
                    month: monthLabel(m.month),
                    total: parseFloat(m.total_value || 0),
                  }))}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                    <Tooltip formatter={(v:any)=>fmtCurrency(v)} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4,4,0,0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Contract Status Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown of contract statuses</p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {stats && stats.contract_status_distribution && stats.contract_status_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={stats.contract_status_distribution}
                         dataKey="count"
                         nameKey="status"
                         cx="50%" cy="50%" outerRadius={120}>
                      {stats.contract_status_distribution.map((_: any, idx: number) => (
                        <Cell key={idx} fill={colors[idx % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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
  )
}
