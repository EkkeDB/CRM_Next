'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart,
  LineChart,
  Target,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  Zap,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Legend
} from 'recharts'
import { contractsApi, counterpartiesApi, commoditiesApi, referenceDataApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Contract, Counterparty, Commodity, Trader } from '@/types'

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c']

interface AnalyticsData {
  contractTrends: { month: string; contracts: number; value: number; avgValue: number }[]
  statusDistribution: { name: string; value: number; color: string }[]
  commodityAnalysis: { name: string; volume: number; value: number; contracts: number }[]
  counterpartyDistribution: { name: string; value: number; percentage: number }[]
  traderPerformance: { name: string; contracts: number; value: number; completion: number }[]
  monthlyComparison: { month: string; thisYear: number; lastYear: number }[]
  kpis: {
    totalContracts: number
    totalValue: number
    avgContractSize: number
    completionRate: number
    growthRate: number
    activeTraders: number
  }
}

const TIME_PERIODS = [
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'last6months', label: 'Last 6 Months' },
  { value: 'last12months', label: 'Last 12 Months' },
  { value: 'ytd', label: 'Year to Date' },
]

export default function AnalyticsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [timePeriod, setTimePeriod] = useState('last12months')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (contracts.length > 0) {
      processAnalytics()
    }
  }, [contracts, timePeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contractsRes, counterpartiesRes, commoditiesRes, tradersRes] = await Promise.all([
        contractsApi.getAll(),
        counterpartiesApi.getAll(),
        commoditiesApi.getAll(),
        referenceDataApi.getTraders()
      ])

      setContracts(contractsRes.results || contractsRes)
      setCounterparties(counterpartiesRes.results || counterpartiesRes)
      setCommodities(commoditiesRes.results || commoditiesRes)
      setTraders(tradersRes)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch data for analytics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getFilteredContracts = () => {
    const now = new Date()
    let startDate = new Date()

    switch (timePeriod) {
      case 'last30':
        startDate.setDate(now.getDate() - 30)
        break
      case 'last90':
        startDate.setDate(now.getDate() - 90)
        break
      case 'last6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case 'last12months':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    return contracts.filter(contract => new Date(contract.date) >= startDate)
  }

  const processAnalytics = async () => {
    try {
      setProcessing(true)
      const filteredContracts = getFilteredContracts()
      
      // Contract trends by month
      const monthlyData = new Map()
      filteredContracts.forEach(contract => {
        const monthKey = new Date(contract.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { contracts: 0, value: 0 })
        }
        const data = monthlyData.get(monthKey)
        data.contracts++
        data.value += parseFloat(contract.price) * parseFloat(contract.quantity)
      })

      const contractTrends = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          contracts: data.contracts,
          value: data.value,
          avgValue: data.contracts > 0 ? data.value / data.contracts : 0
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // Status distribution
      const statusCounts = new Map()
      filteredContracts.forEach(contract => {
        statusCounts.set(contract.status, (statusCounts.get(contract.status) || 0) + 1)
      })

      const statusDistribution = Array.from(statusCounts.entries()).map(([status, count], index) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: COLORS[index % COLORS.length]
      }))

      // Commodity analysis
      const commodityData = new Map()
      filteredContracts.forEach(contract => {
        const name = contract.commodity_name || 'Unknown'
        if (!commodityData.has(name)) {
          commodityData.set(name, { volume: 0, value: 0, contracts: 0 })
        }
        const data = commodityData.get(name)
        data.volume += parseFloat(contract.quantity)
        data.value += parseFloat(contract.price) * parseFloat(contract.quantity)
        data.contracts++
      })

      const commodityAnalysis = Array.from(commodityData.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      // Counterparty distribution
      const counterpartyData = new Map()
      filteredContracts.forEach(contract => {
        const name = contract.counterparty_name || 'Unknown'
        if (!counterpartyData.has(name)) {
          counterpartyData.set(name, 0)
        }
        counterpartyData.set(name, counterpartyData.get(name) + 1)
      })

      const totalContracts = filteredContracts.length
      const counterpartyDistribution = Array.from(counterpartyData.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: (value / totalContracts) * 100
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      // Trader performance
      const traderData = new Map()
      filteredContracts.forEach(contract => {
        const name = contract.trader_name || 'Unknown'
        if (!traderData.has(name)) {
          traderData.set(name, { contracts: 0, value: 0, completed: 0 })
        }
        const data = traderData.get(name)
        data.contracts++
        data.value += parseFloat(contract.price) * parseFloat(contract.quantity)
        if (contract.status === 'completed') data.completed++
      })

      const traderPerformance = Array.from(traderData.entries())
        .map(([name, data]) => ({
          name,
          contracts: data.contracts,
          value: data.value,
          completion: data.contracts > 0 ? (data.completed / data.contracts) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      // Monthly comparison (mock data for year-over-year)
      const monthlyComparison = contractTrends.map(item => ({
        month: item.month,
        thisYear: item.value,
        lastYear: item.value * (0.8 + Math.random() * 0.4) // Mock last year data
      }))

      // KPIs
      const totalValue = filteredContracts.reduce((sum, c) => sum + (parseFloat(c.price) * parseFloat(c.quantity)), 0)
      const completedContracts = filteredContracts.filter(c => c.status === 'completed').length
      const kpis = {
        totalContracts: filteredContracts.length,
        totalValue,
        avgContractSize: filteredContracts.length > 0 ? totalValue / filteredContracts.length : 0,
        completionRate: filteredContracts.length > 0 ? (completedContracts / filteredContracts.length) * 100 : 0,
        growthRate: 12.5, // Mock growth rate
        activeTraders: traderData.size
      }

      setAnalyticsData({
        contractTrends,
        statusDistribution,
        commodityAnalysis,
        counterpartyDistribution,
        traderPerformance,
        monthlyComparison,
        kpis
      })

    } catch (error) {
      console.error('Error processing analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to process analytics data',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics
          </h1>
          <p className="text-gray-600 mt-2">Advanced data analysis and business insights</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchData} disabled={loading || processing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${(loading || processing) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="timePeriod">Time Period</Label>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_PERIODS.map(period => (
                    <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                  <p className="text-2xl font-bold">{formatNumber(analyticsData.kpis.totalContracts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(analyticsData.kpis.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Contract</p>
                  <p className="text-2xl font-bold">{formatCurrency(analyticsData.kpis.avgContractSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{formatPercent(analyticsData.kpis.completionRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {analyticsData.kpis.growthRate >= 0 ? (
                  <ArrowUp className="h-8 w-8 text-green-600" />
                ) : (
                  <ArrowDown className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold">{formatPercent(analyticsData.kpis.growthRate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Traders</p>
                  <p className="text-2xl font-bold">{formatNumber(analyticsData.kpis.activeTraders)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {processing && (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processing analytics...</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {analyticsData && !processing && (
        <div className="space-y-6">
          {/* Contract Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Contract Trends
                </CardTitle>
                <CardDescription>Monthly contract volume and value trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.contractTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'contracts' ? formatNumber(value as number) : formatCurrency(value as number),
                        name === 'contracts' ? 'Contracts' : name === 'value' ? 'Total Value' : 'Avg Value'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="contracts" fill="#8884d8" name="contracts" />
                    <Line yAxisId="right" type="monotone" dataKey="avgValue" stroke="#82ca9d" name="avgValue" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Contract Status Distribution
                </CardTitle>
                <CardDescription>Current contract status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Commodity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Commodities by Value
              </CardTitle>
              <CardDescription>Most valuable commodities by contract value</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.commodityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12} 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'value' ? formatCurrency(value as number) : 
                      name === 'volume' ? `${formatNumber(value as number)} MT` :
                      formatNumber(value as number),
                      name === 'value' ? 'Total Value' : 
                      name === 'volume' ? 'Volume' : 'Contracts'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#0088FE" name="value" />
                  <Bar dataKey="volume" fill="#00C49F" name="volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trader Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trader Performance Analysis
              </CardTitle>
              <CardDescription>Top performing traders by value and completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analyticsData.traderPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12} 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'value' ? formatCurrency(value as number) :
                      name === 'completion' ? `${(value as number).toFixed(1)}%` :
                      formatNumber(value as number),
                      name === 'value' ? 'Total Value' :
                      name === 'completion' ? 'Completion Rate' : 'Contracts'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="value" />
                  <Line yAxisId="right" type="monotone" dataKey="completion" stroke="#82ca9d" name="completion" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Data State */}
      {!analyticsData && !processing && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No data available for analytics</p>
            <p className="text-sm text-gray-400 mt-2">Add some contracts to see analytical insights</p>
          </CardContent>
        </Card>
      )}

      {/* Implementation Note */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>
              This analytics dashboard provides real-time insights based on your contract data. 
              Advanced features like predictive analytics and ML insights will be added in Phase 3.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}