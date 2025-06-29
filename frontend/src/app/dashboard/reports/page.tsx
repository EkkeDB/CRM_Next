'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Package, 
  Building, 
  Users,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw
} from 'lucide-react'
import { contractsApi, counterpartiesApi, commoditiesApi, referenceDataApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Contract, Counterparty, Commodity, Trader } from '@/types'

interface ReportData {
  contractsByStatus: { status: string; count: number; value: number }[]
  contractsByMonth: { month: string; count: number; value: number }[]
  topCounterparties: { name: string; contracts: number; value: number }[]
  topCommodities: { name: string; contracts: number; volume: number }[]
  traderPerformance: { name: string; contracts: number; value: number }[]
  summary: {
    totalContracts: number
    totalValue: number
    avgContractValue: number
    activeContracts: number
    completedContracts: number
  }
}

const REPORT_TYPES = [
  { value: 'overview', label: 'Business Overview' },
  { value: 'contracts', label: 'Contract Analysis' },
  { value: 'counterparties', label: 'Counterparty Report' },
  { value: 'commodities', label: 'Commodity Report' },
  { value: 'traders', label: 'Trader Performance' },
  { value: 'financial', label: 'Financial Summary' },
]

const TIME_PERIODS = [
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'last6months', label: 'Last 6 Months' },
  { value: 'last12months', label: 'Last 12 Months' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'all', label: 'All Time' },
]

export default function ReportsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState('overview')
  const [timePeriod, setTimePeriod] = useState('last30')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (contracts.length > 0) {
      generateReport()
    }
  }, [contracts, reportType, timePeriod])

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
        description: 'Failed to fetch data for reports',
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
      case 'all':
        return contracts
    }

    return contracts.filter(contract => new Date(contract.date) >= startDate)
  }

  const generateReport = async () => {
    try {
      setGenerating(true)
      const filteredContracts = getFilteredContracts()

      // Generate report data based on filtered contracts
      const contractsByStatus = ['draft', 'approved', 'executed', 'completed', 'cancelled'].map(status => {
        const statusContracts = filteredContracts.filter(c => c.status === status)
        return {
          status,
          count: statusContracts.length,
          value: statusContracts.reduce((sum, c) => sum + (parseFloat(c.price) * parseFloat(c.quantity)), 0)
        }
      })

      // Monthly analysis
      const monthlyData = new Map()
      filteredContracts.forEach(contract => {
        const monthKey = new Date(contract.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' })
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { count: 0, value: 0 })
        }
        const data = monthlyData.get(monthKey)
        data.count++
        data.value += parseFloat(contract.price) * parseFloat(contract.quantity)
      })

      const contractsByMonth = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        count: data.count,
        value: data.value
      }))

      // Top counterparties
      const counterpartyData = new Map()
      filteredContracts.forEach(contract => {
        const cpName = contract.counterparty_name || 'Unknown'
        if (!counterpartyData.has(cpName)) {
          counterpartyData.set(cpName, { contracts: 0, value: 0 })
        }
        const data = counterpartyData.get(cpName)
        data.contracts++
        data.value += parseFloat(contract.price) * parseFloat(contract.quantity)
      })

      const topCounterparties = Array.from(counterpartyData.entries())
        .map(([name, data]) => ({ name, contracts: data.contracts, value: data.value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      // Top commodities
      const commodityData = new Map()
      filteredContracts.forEach(contract => {
        const commodityName = contract.commodity_name || 'Unknown'
        if (!commodityData.has(commodityName)) {
          commodityData.set(commodityName, { contracts: 0, volume: 0 })
        }
        const data = commodityData.get(commodityName)
        data.contracts++
        data.volume += parseFloat(contract.quantity)
      })

      const topCommodities = Array.from(commodityData.entries())
        .map(([name, data]) => ({ name, contracts: data.contracts, volume: data.volume }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10)

      // Trader performance
      const traderData = new Map()
      filteredContracts.forEach(contract => {
        const traderName = contract.trader_name || 'Unknown'
        if (!traderData.has(traderName)) {
          traderData.set(traderName, { contracts: 0, value: 0 })
        }
        const data = traderData.get(traderName)
        data.contracts++
        data.value += parseFloat(contract.price) * parseFloat(contract.quantity)
      })

      const traderPerformance = Array.from(traderData.entries())
        .map(([name, data]) => ({ name, contracts: data.contracts, value: data.value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      // Summary
      const totalValue = filteredContracts.reduce((sum, c) => sum + (parseFloat(c.price) * parseFloat(c.quantity)), 0)
      const summary = {
        totalContracts: filteredContracts.length,
        totalValue,
        avgContractValue: filteredContracts.length > 0 ? totalValue / filteredContracts.length : 0,
        activeContracts: filteredContracts.filter(c => c.status === 'approved' || c.status === 'executed').length,
        completedContracts: filteredContracts.filter(c => c.status === 'completed').length,
      }

      setReportData({
        contractsByStatus,
        contractsByMonth,
        topCounterparties,
        topCommodities,
        traderPerformance,
        summary
      })

    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
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

  const exportReport = () => {
    toast({
      title: 'Export Coming Soon',
      description: 'PDF and Excel export functionality will be implemented in Phase 1',
    })
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
            <TrendingUp className="h-8 w-8 text-primary" />
            Reports
          </h1>
          <p className="text-gray-600 mt-2">Business intelligence and performance analytics</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                  <p className="text-2xl font-bold">{formatNumber(reportData.summary.totalContracts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Contract</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.summary.avgContractValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{formatNumber(reportData.summary.activeContracts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{formatNumber(reportData.summary.completedContracts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {generating && (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating report...</p>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {reportData && !generating && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Contract Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.contractsByStatus.filter(item => item.count > 0).map((item) => (
                    <TableRow key={item.status}>
                      <TableCell>
                        <Badge variant={
                          item.status === 'completed' ? 'default' :
                          item.status === 'executed' ? 'secondary' :
                          item.status === 'approved' ? 'outline' :
                          'destructive'
                        }>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatNumber(item.count)}</TableCell>
                      <TableCell>{formatCurrency(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Counterparties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Top Counterparties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topCounterparties.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatNumber(item.contracts)}</TableCell>
                      <TableCell>{formatCurrency(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Commodities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Commodities by Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topCommodities.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatNumber(item.contracts)}</TableCell>
                      <TableCell>{formatNumber(item.volume)} MT</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Trader Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trader Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trader</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.traderPerformance.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatNumber(item.contracts)}</TableCell>
                      <TableCell>{formatCurrency(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Data State */}
      {!reportData && !generating && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No data available for the selected period</p>
            <p className="text-sm text-gray-400 mt-2">Try selecting a different time period or add some contracts</p>
          </CardContent>
        </Card>
      )}

      {/* Implementation Note */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              This is a basic reporting implementation. Advanced features like PDF/Excel export, 
              scheduled reports, and custom report builder will be added in Phase 1.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}