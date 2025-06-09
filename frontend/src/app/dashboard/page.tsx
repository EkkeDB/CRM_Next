"use client"

import React from 'react'
import { useDashboardStats } from '@/hooks/use-contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock 
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts'

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
}

function StatCard({ title, value, change, changeType, icon }: StatCardProps) {
  const getChangeColor = (type: typeof changeType) => {
    switch (type) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getChangeIcon = (type: typeof changeType) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />
      case 'negative':
        return <TrendingDown className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${getChangeColor(changeType)} flex items-center gap-1`}>
            {getChangeIcon(changeType)}
            {change}
          </p>
        )}
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
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading dashboard data</p>
              <p className="text-sm text-gray-500 mt-2">
                Please try again later or contact support if the problem persists.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Process data for charts
  const monthlyData = stats?.monthly_contract_values?.map(item => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    value: parseFloat(item.total_value),
    contracts: item.contract_count
  })) || []

  const statusData = stats?.contract_status_distribution?.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count
  })) || []

  const topCounterparties = stats?.top_counterparties?.slice(0, 5) || []
  const topCommodities = stats?.top_commodities?.slice(0, 5) || []

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          value={formatNumber(stats?.total_contracts || 0)}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(parseFloat(stats?.total_value || '0'))}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Active Contracts"
          value={formatNumber(stats?.active_contracts || 0)}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Pending Contracts"
          value={formatNumber(stats?.pending_contracts || 0)}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Monthly Contract Values */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Contract Values</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${formatNumber(value / 1000)}K`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-semibold">{`Month: ${label}`}</p>
                          <p className="text-blue-600">
                            {`Value: ${formatCurrency(payload[0].value as number)}`}
                          </p>
                          <p className="text-gray-600">
                            {`Contracts: ${payload[0].payload.contracts}`}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  strokeWidth={2} 
                  stroke="#8884d8"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contract Status Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Contract Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Counterparties and Commodities */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Counterparties */}
        <Card>
          <CardHeader>
            <CardTitle>Top Counterparties by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCounterparties.map((cp, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">
                      {cp.counterparty__counterparty_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {formatCurrency(parseFloat(cp.total_value))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cp.contract_count} contracts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Commodities */}
        <Card>
          <CardHeader>
            <CardTitle>Top Commodities by Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCommodities.map((commodity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">
                      {commodity.commodity__commodity_name_short}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {formatNumber(parseFloat(commodity.total_quantity))} MT
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {commodity.contract_count} contracts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}