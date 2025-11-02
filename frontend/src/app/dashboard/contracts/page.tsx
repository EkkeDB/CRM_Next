'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Eye, Trash2, FileText, DollarSign, Calendar, Activity, ChevronRight, ChevronDown, Layers } from 'lucide-react'
import { contractsApi, counterpartiesApi, commoditiesApi, referenceDataApi, dealsApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Contract, Counterparty, Commodity, Trader, Currency, TradeOperationType } from '@/types'

const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'executed', label: 'Executed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface ReferenceData {
  sociedades: any[]
  deliveryFormats: any[]
  additives: any[]
  brokers: any[]
  icoterms: any[]
  costCenters: any[]
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [tradeOperationTypes, setTradeOperationTypes] = useState<TradeOperationType[]>([])
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    sociedades: [],
    deliveryFormats: [],
    additives: [],
    brokers: [],
    icoterms: [],
    costCenters: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dealCreateOpen, setDealCreateOpen] = useState(false)
  const [dealCreateLoading, setDealCreateLoading] = useState(false)
  const [dealDialogOpen, setDealDialogOpen] = useState(false)
  const [dealEditLoading, setDealEditLoading] = useState(false)
  const [expandedDeals, setExpandedDeals] = useState<Record<string, boolean>>({})
  const [editingDealId, setEditingDealId] = useState<number | null>(null)
  const [dealPropagate, setDealPropagate] = useState(true)
  const [dealForm, setDealForm] = useState({
    price: '',
    broker_fee: '',
    freight_cost: '',
    forex: '1.0000',
    trade_currency: '',
    payment_days: '30',
    unit_of_measure: 'MT',
    entrega: '',
    delivery_format: '',
    additive: '',
    broker: '',
    icoterm: '',
    cost_center: '',
    notes: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const { toast } = useToast()

  // Async counterparty lookup for the select (server-side search + load more)
  const [cpQuery, setCpQuery] = useState('')
  const [cpOptions, setCpOptions] = useState<Counterparty[]>([])
  const [cpPage, setCpPage] = useState(1)
  const [cpHasMore, setCpHasMore] = useState(false)
  const [cpLoading, setCpLoading] = useState(false)
  const firstCpItemRef = useRef<HTMLDivElement | null>(null)

  const [formData, setFormData] = useState({
    contract_number: '',
    counterparty: '',
    commodity: '',
    trader: '',
    quantity: '',
    price: '',
    trade_currency: '',
    date: '',
    status: 'draft',
    trade_operation_type: '',
    sociedad: '',
    delivery_format: '',
    additive: '',
    broker: '',
    icoterm: '',
    cost_center: '',
    broker_fee: '',
    freight_cost: '',
    forex: '1.00',
    payment_days: '30',
    unit_of_measure: 'MT',
    entrega: '',
    delivery_period: '',
    notes: ''
  })

  // New Deal form state
  const [dealFormCreate, setDealFormCreate] = useState({
    trader: '',
    trade_operation_type: '',
    sociedad: '',
    counterparty: '',
    commodity: '',
    delivery_format: '',
    additive: '',
    broker: '',
    icoterm: '',
    cost_center: '',
    broker_fee: '0.00',
    broker_fee_currency: '',
    freight_cost: '0.00',
    forex: '1.0000',
    price: '0.00',
    trade_currency: '',
    payment_days: '30',
    unit_of_measure: 'MT',
    entrega: '',
    date: '',
    status: 'draft' as any,
    notes: ''
  })
  const [dealLines, setDealLines] = useState<Array<{ delivery_period_start: string; delivery_period_end: string; quantity: string }>>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [
        contractsRes, 
        counterpartiesRes, 
        commoditiesRes, 
        tradersRes, 
        currenciesRes, 
        tradeTypesRes,
        sociedadesRes,
        deliveryFormatsRes,
        additivesRes,
        brokersRes,
        icotermsRes,
        costCentersRes
      ] = await Promise.all([
        contractsApi.getAll(),
        counterpartiesApi.getAll(),
        commoditiesApi.getAll(),
        referenceDataApi.getTraders(),
        referenceDataApi.getCurrencies(),
        referenceDataApi.getTradeOperationTypes(),
        referenceDataApi.getSociedades(),
        referenceDataApi.getDeliveryFormats(),
        referenceDataApi.getAdditives(),
        referenceDataApi.getBrokers(),
        referenceDataApi.getIcoterms(),
        referenceDataApi.getCostCenters()
      ])

      setContracts(contractsRes.results || contractsRes)
      setCounterparties(counterpartiesRes.results || counterpartiesRes)
      setCpOptions((counterpartiesRes.results || counterpartiesRes) as Counterparty[])
      setCommodities(commoditiesRes.results || commoditiesRes)
      setTraders(tradersRes)
      setCurrencies(currenciesRes)
      setTradeOperationTypes(tradeTypesRes)
      setReferenceData({
        sociedades: sociedadesRes,
        deliveryFormats: deliveryFormatsRes,
        additives: additivesRes,
        brokers: brokersRes,
        icoterms: icotermsRes,
        costCenters: costCentersRes
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load counterparties for the select with optional server-side search and paging
  const loadCounterparties = async (page = 1, reset = false) => {
    try {
      setCpLoading(true)
      const params: any = { page }
      const term = (cpQuery || '').trim()
      if (term.length >= 3) params.search = term
      const resp: any = await counterpartiesApi.getAll(params)
      const list: Counterparty[] = resp.results || resp
      const nextUrl = resp?.next
      const count = typeof resp?.count === 'number' ? resp.count : undefined
      const hasMore = Boolean(nextUrl) || (typeof count === 'number' && (page * (list?.length || 0)) < count)
      setCpHasMore(hasMore)
      setCpPage(page)
      setCpOptions(prev => (reset ? list : [...prev, ...list]))
    } catch {
      // ignore
    } finally {
      setCpLoading(false)
    }
  }

  // Debounce cpQuery changes
  useEffect(() => {
    const handle = setTimeout(() => {
      const term = (cpQuery || '').trim()
      if (term.length === 0) {
        loadCounterparties(1, true)
      } else if (term.length >= 3) {
        loadCounterparties(1, true)
      }
    }, 300)
    return () => clearTimeout(handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert form data to proper types for API
      const contractData = {
        contract_number: formData.contract_number,
        trader: parseInt(formData.trader),
        trade_operation_type: parseInt(formData.trade_operation_type),
        sociedad: parseInt(formData.sociedad),
        counterparty: parseInt(formData.counterparty),
        commodity: parseInt(formData.commodity),
        delivery_format: parseInt(formData.delivery_format),
        additive: parseInt(formData.additive),
        broker: parseInt(formData.broker),
        icoterm: parseInt(formData.icoterm),
        cost_center: parseInt(formData.cost_center),
        broker_fee: formData.broker_fee || '0.00',
        broker_fee_currency: parseInt(formData.trade_currency),
        freight_cost: formData.freight_cost || '0.00',
        forex: formData.forex || '1.00',
        price: formData.price,
        trade_currency: parseInt(formData.trade_currency),
        payment_days: parseInt(formData.payment_days) || 30,
        quantity: formData.quantity,
        unit_of_measure: formData.unit_of_measure || 'MT',
        entrega: formData.entrega || '',
        delivery_period: formData.delivery_period || '',
        date: formData.date,
        notes: formData.notes
      }

      if (editingContract) {
        await contractsApi.update(editingContract.id, contractData)
        toast({
          title: 'Success',
          description: 'Contract updated successfully'
        })
      } else {
        await contractsApi.create(contractData)
        toast({
          title: 'Success',
          description: 'Contract created successfully'
        })
      }
      setDialogOpen(false)
      setEditingContract(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving contract:', error)
      toast({
        title: 'Error',
        description: 'Failed to save contract',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = async (contract: Contract) => {
    setEditLoading(true)
    setDialogOpen(true)
    try {
      const full = await contractsApi.getById(contract.id)
      setEditingContract(full)
      setFormData({
        contract_number: full.contract_number || '',
        counterparty: full.counterparty !== undefined && full.counterparty !== null ? full.counterparty.toString() : '',
        commodity: full.commodity !== undefined && full.commodity !== null ? full.commodity.toString() : '',
        trader: full.trader !== undefined && full.trader !== null ? full.trader.toString() : '',
        quantity: full.quantity || '',
        price: full.price || '',
        trade_currency: full.trade_currency !== undefined && full.trade_currency !== null ? full.trade_currency.toString() : '',
        date: full.date || '',
        status: full.status || 'draft',
        trade_operation_type: full.trade_operation_type !== undefined && full.trade_operation_type !== null ? full.trade_operation_type.toString() : '',
        sociedad: (full as any).sociedad !== undefined && (full as any).sociedad !== null ? (full as any).sociedad.toString() : '',
        delivery_format: (full as any).delivery_format !== undefined && (full as any).delivery_format !== null ? (full as any).delivery_format.toString() : '',
        additive: (full as any).additive !== undefined && (full as any).additive !== null ? (full as any).additive.toString() : '',
        broker: (full as any).broker !== undefined && (full as any).broker !== null ? (full as any).broker.toString() : '',
        icoterm: (full as any).icoterm !== undefined && (full as any).icoterm !== null ? (full as any).icoterm.toString() : '',
        cost_center: (full as any).cost_center !== undefined && (full as any).cost_center !== null ? (full as any).cost_center.toString() : '',
        broker_fee: (full as any).broker_fee || '',
        freight_cost: (full as any).freight_cost || '',
        forex: (full as any).forex?.toString?.() || '1.00',
        payment_days: ((full as any).payment_days !== undefined && (full as any).payment_days !== null) ? String((full as any).payment_days) : '30',
        unit_of_measure: (full as any).unit_of_measure || 'MT',
        entrega: (full as any).entrega || '',
        delivery_period: (full as any).delivery_period || '',
        notes: full.notes || ''
      })
    } catch (error) {
      console.error('Failed to load contract details', error)
      toast({ title: 'Error', description: 'Failed to load contract details', variant: 'destructive' })
    }
    setEditLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contract?')) return
    
    try {
      await contractsApi.delete(id)
      toast({
        title: 'Success',
        description: 'Contract deleted successfully'
      })
      fetchData()
    } catch (error) {
      console.error('Error deleting contract:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete contract',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      contract_number: '',
      counterparty: '',
      commodity: '',
      trader: '',
      quantity: '',
      price: '',
      trade_currency: '',
      date: '',
      status: 'draft',
      trade_operation_type: '',
      sociedad: '',
      delivery_format: '',
      additive: '',
      broker: '',
      icoterm: '',
      cost_center: '',
      broker_fee: '',
      freight_cost: '',
      forex: '1.00',
      payment_days: '30',
      unit_of_measure: 'MT',
      entrega: '',
      delivery_period: '',
      notes: ''
    })
  }

  // Deal create helpers
  const resetDealCreate = () => {
    setDealFormCreate({
      trader: '', trade_operation_type: '', sociedad: '', counterparty: '', commodity: '',
      delivery_format: '', additive: '', broker: '', icoterm: '', cost_center: '',
      broker_fee: '0.00', broker_fee_currency: '', freight_cost: '0.00', forex: '1.0000', price: '0.00',
      trade_currency: '', payment_days: '30', unit_of_measure: 'MT', entrega: '', date: '', status: 'draft', notes: ''
    })
    setDealLines([])
  }

  const addNextMonth = () => {
    const today = new Date()
    const baseDate = dealLines.length ? new Date(dealLines[dealLines.length - 1].delivery_period_end) : today
    const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1)
    const end = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    setDealLines([...dealLines, { delivery_period_start: fmt(nextMonth), delivery_period_end: fmt(end), quantity: '0.000' }])
  }

  const handleDealCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setDealCreateLoading(true)
      if (!dealLines.length) {
        toast({ title: 'Validation', description: 'Add at least one delivery period', variant: 'destructive' })
        setDealCreateLoading(false)
        return
      }
      const payload: any = {
        trader: parseInt(dealFormCreate.trader),
        trade_operation_type: parseInt(dealFormCreate.trade_operation_type),
        sociedad: parseInt(dealFormCreate.sociedad),
        counterparty: parseInt(dealFormCreate.counterparty),
        commodity: parseInt(dealFormCreate.commodity),
        delivery_format: parseInt(dealFormCreate.delivery_format),
        additive: parseInt(dealFormCreate.additive),
        broker: parseInt(dealFormCreate.broker),
        icoterm: parseInt(dealFormCreate.icoterm),
        cost_center: parseInt(dealFormCreate.cost_center),
        broker_fee: dealFormCreate.broker_fee,
        broker_fee_currency: parseInt(dealFormCreate.broker_fee_currency),
        freight_cost: dealFormCreate.freight_cost,
        forex: dealFormCreate.forex,
        price: dealFormCreate.price,
        trade_currency: parseInt(dealFormCreate.trade_currency),
        payment_days: parseInt(dealFormCreate.payment_days),
        unit_of_measure: dealFormCreate.unit_of_measure,
        entrega: dealFormCreate.entrega,
        date: dealFormCreate.date,
        status: dealFormCreate.status,
        notes: dealFormCreate.notes,
        lines: dealLines,
      }
      const created = await dealsApi.create(payload)
      await dealsApi.generateContracts(created.id)
      toast({ title: 'Success', description: `Deal ${created.deal_number} created and contracts generated` })
      setDealCreateOpen(false)
      resetDealCreate()
      await fetchData()
    } catch (e: any) {
      console.error('Failed to save deal', e)
      const detail = e?.response?.data ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)) : 'Failed to save deal'
      toast({ title: 'Error', description: detail, variant: 'destructive' })
    } finally {
      setDealCreateLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'executed':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'approved':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const formatNumber = (num: number | string) => {
    const number = typeof num === 'string' ? parseFloat(num) : num
    return new Intl.NumberFormat('en-US').format(number)
  }

  const getTotalValue = () => {
    return contracts.reduce((sum, contract) => {
      return sum + (parseFloat(contract.price) * parseFloat(contract.quantity))
    }, 0)
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.counterparty_name && contract.counterparty_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contract.commodity_name && contract.commodity_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Group contracts by deal for UI
  const grouped = filteredContracts.reduce<Record<string, { dealId: number | null, dealNumber: string, rows: Contract[], totalQuantity: number, totalValue: number }>>((acc, c) => {
    const key = (c.deal ?? 'none').toString()
    const dealNumber = c.deal_number ?? 'No Deal'
    const quantity = parseFloat((c.quantity as any) || '0') || 0
    const totalValue = (c as any).total_value ? parseFloat((c as any).total_value) : (parseFloat((c.price as any) || '0') * quantity)
    if (!acc[key]) acc[key] = { dealId: (c.deal ?? null), dealNumber, rows: [], totalQuantity: 0, totalValue: 0 }
    acc[key].rows.push(c)
    acc[key].totalQuantity += quantity
    acc[key].totalValue += totalValue
    return acc
  }, {})

  const toggleExpand = (key: string) => setExpandedDeals(prev => ({ ...prev, [key]: !prev[key] }))

  const openDealEdit = async (dealId: number) => {
    setDealEditLoading(true)
    setDealDialogOpen(true)
    setEditingDealId(dealId)
    try {
      const full = await dealsApi.getById(dealId)
      setDealForm({
        price: (full as any).price?.toString?.() || '0.00',
        broker_fee: (full as any).broker_fee?.toString?.() || '0.00',
        freight_cost: (full as any).freight_cost?.toString?.() || '0.00',
        forex: (full as any).forex?.toString?.() || '1.0000',
        trade_currency: (full as any).trade_currency?.toString?.() || '',
        payment_days: (full as any).payment_days?.toString?.() || '30',
        unit_of_measure: (full as any).unit_of_measure || 'MT',
        entrega: (full as any).entrega || '',
        delivery_format: (full as any).delivery_format?.toString?.() || '',
        additive: (full as any).additive?.toString?.() || '',
        broker: (full as any).broker?.toString?.() || '',
        icoterm: (full as any).icoterm?.toString?.() || '',
        cost_center: (full as any).cost_center?.toString?.() || '',
        notes: (full as any).notes || '',
      })
      setDealPropagate(true)
    } catch (e) {
      console.error('Failed to load deal details', e)
      toast({ title: 'Error', description: 'Failed to load deal details', variant: 'destructive' })
    }
    setDealEditLoading(false)
  }

  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDealId) return
    try {
      setDealEditLoading(true)
      await dealsApi.update(editingDealId, {
        price: dealForm.price,
        broker_fee: dealForm.broker_fee,
        freight_cost: dealForm.freight_cost,
        forex: dealForm.forex,
        trade_currency: dealForm.trade_currency ? parseInt(dealForm.trade_currency) : undefined,
        payment_days: parseInt(dealForm.payment_days),
        unit_of_measure: dealForm.unit_of_measure,
        entrega: dealForm.entrega,
        delivery_format: dealForm.delivery_format ? parseInt(dealForm.delivery_format) : undefined,
        additive: dealForm.additive ? parseInt(dealForm.additive) : undefined,
        broker: dealForm.broker ? parseInt(dealForm.broker) : undefined,
        icoterm: dealForm.icoterm ? parseInt(dealForm.icoterm) : undefined,
        cost_center: dealForm.cost_center ? parseInt(dealForm.cost_center) : undefined,
        notes: dealForm.notes,
      } as any, { propagate: dealPropagate })
      toast({ title: 'Success', description: 'Deal updated successfully' })
      await fetchData()
      setDealDialogOpen(false)
      setEditingDealId(null)
    } catch (e: any) {
      console.error('Failed to update deal', e)
      const detail = e?.response?.data ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)) : 'Failed to update deal'
      toast({ title: 'Error', description: detail, variant: 'destructive' })
    } finally {
      setDealEditLoading(false)
    }
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
            <FileText className="h-8 w-8 text-primary" />
            Contract Management
          </h1>
          <p className="text-gray-600 mt-2">Manage commodity trading contracts and workflows</p>
        </div>
        {/* New Deal button */}
        <Button onClick={() => { resetDealCreate(); setDealCreateOpen(true) }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
        {/* Contract edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editingContract ? 'Edit Contract' : 'Create New Contract'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingContract ? 'update' : 'create'} a contract.
              </DialogDescription>
            </DialogHeader>
            {editLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Loading contract...</span>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_number">Contract Number</Label>
                  <Input
                    id="contract_number"
                    value={formData.contract_number}
                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                    required
                    placeholder="e.g., CONT-2025-000001"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="counterparty">Counterparty</Label>
                  <Select value={formData.counterparty} onValueChange={(value) => setFormData({ ...formData, counterparty: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select counterparty" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-400" />
                          <Input
                            autoFocus
                            placeholder="Search counterparties... (min 3 letters)"
                            value={cpQuery}
                            onChange={(e) => setCpQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown' && firstCpItemRef.current) {
                                e.preventDefault()
                                firstCpItemRef.current.focus()
                              }
                            }}
                          />
                        </div>
                      </div>
                      {(cpOptions.length ? cpOptions : counterparties).map((cp, idx) => (
                        <SelectItem
                          key={cp.id}
                          value={cp.id.toString()}
                          ref={idx === 0 ? (firstCpItemRef as any) : undefined}
                        >
                          {cp.counterparty_name}
                        </SelectItem>
                      ))}
                      {cpHasMore && (
                        <div className="p-2">
                          <Button variant="outline" size="sm" onClick={() => loadCounterparties(cpPage + 1)} disabled={cpLoading}>
                            {cpLoading ? (
                              <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /> Loading...</span>
                            ) : 'Load more'}
                          </Button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="commodity">Commodity</Label>
                  <Select value={formData.commodity} onValueChange={(value) => setFormData({ ...formData, commodity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodities.map(commodity => (
                        <SelectItem key={commodity.id} value={commodity.id.toString()}>{commodity.commodity_name_short}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trader">Trader</Label>
                  <Select value={formData.trader} onValueChange={(value) => setFormData({ ...formData, trader: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trader" />
                    </SelectTrigger>
                    <SelectContent>
                      {traders.map(trader => (
                        <SelectItem key={trader.id} value={trader.id.toString()}>{trader.trader_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="trade_operation_type">Operation Type</Label>
                  <Select value={formData.trade_operation_type} onValueChange={(value) => setFormData({ ...formData, trade_operation_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {tradeOperationTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>{type.trade_operation_type_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="trade_currency">Currency</Label>
                  <Select value={formData.trade_currency} onValueChange={(value) => setFormData({ ...formData, trade_currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.id} value={currency.id.toString()}>{currency.currency_code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sociedad">Sociedad *</Label>
                  <Select value={formData.sociedad} onValueChange={(value) => setFormData({ ...formData, sociedad: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sociedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData.sociedades.map(sociedad => (
                        <SelectItem key={sociedad.id} value={sociedad.id.toString()}>{sociedad.sociedad_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="broker">Broker *</Label>
                  <Select value={formData.broker} onValueChange={(value) => setFormData({ ...formData, broker: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData.brokers.map(broker => (
                        <SelectItem key={broker.id} value={broker.id.toString()}>{broker.broker_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_format">Delivery Format *</Label>
                  <Select value={formData.delivery_format} onValueChange={(value) => setFormData({ ...formData, delivery_format: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery format" />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData.deliveryFormats.map(format => (
                        <SelectItem key={format.id} value={format.id.toString()}>{format.delivery_format_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="additive">Additive *</Label>
                  <Select value={formData.additive} onValueChange={(value) => setFormData({ ...formData, additive: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select additive" />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData.additives.map(additive => (
                        <SelectItem key={additive.id} value={additive.id.toString()}>{additive.additive_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icoterm">ICOTERM *</Label>
                  <Select value={formData.icoterm} onValueChange={(value) => setFormData({ ...formData, icoterm: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ICOTERM" />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData.icoterms.map(icoterm => (
                        <SelectItem key={icoterm.id} value={icoterm.id.toString()}>{icoterm.icoterm_code} - {icoterm.icoterm_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cost_center">Cost Center *</Label>
                  <Select value={formData.cost_center} onValueChange={(value) => setFormData({ ...formData, cost_center: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost center" />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData.costCenters.map(center => (
                        <SelectItem key={center.id} value={center.id.toString()}>{center.cost_center_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="broker_fee">Broker Fee</Label>
                  <Input
                    id="broker_fee"
                    type="number"
                    step="0.01"
                    value={formData.broker_fee}
                    onChange={(e) => setFormData({ ...formData, broker_fee: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="freight_cost">Freight Cost</Label>
                  <Input
                    id="freight_cost"
                    type="number"
                    step="0.01"
                    value={formData.freight_cost}
                    onChange={(e) => setFormData({ ...formData, freight_cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="forex">Forex Rate</Label>
                  <Input
                    id="forex"
                    type="number"
                    step="0.0001"
                    value={formData.forex}
                    onChange={(e) => setFormData({ ...formData, forex: e.target.value })}
                    placeholder="1.0000"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_days">Payment Days</Label>
                  <Input
                    id="payment_days"
                    type="number"
                    value={formData.payment_days}
                    onChange={(e) => setFormData({ ...formData, payment_days: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entrega">Delivery Point</Label>
                  <Input
                    id="entrega"
                    value={formData.entrega}
                    onChange={(e) => setFormData({ ...formData, entrega: e.target.value })}
                    placeholder="e.g., Port of Hamburg"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_period">Delivery Period</Label>
                  <Input
                    id="delivery_period"
                    type="date"
                    value={formData.delivery_period}
                    onChange={(e) => setFormData({ ...formData, delivery_period: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="date">Contract Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or special terms..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </Button>
              </div>
            </form>
            )}
          </DialogContent>
        </Dialog>
        {/* New Deal create dialog */}
        <Dialog open={dealCreateOpen} onOpenChange={setDealCreateOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Create New Deal
              </DialogTitle>
              <DialogDescription>Fill in the deal header and add monthly delivery periods.</DialogDescription>
            </DialogHeader>
            {dealCreateLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Saving deal...</span>
              </div>
            ) : (
              <form onSubmit={handleDealCreateSubmit} className="space-y-4">
                {/* Header selects/inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trader</Label>
                    <Select value={dealFormCreate.trader} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, trader: v })}>
                      <SelectTrigger><SelectValue placeholder="Select trader" /></SelectTrigger>
                      <SelectContent>
                        {traders.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.trader_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Counterparty</Label>
                    <Select value={dealFormCreate.counterparty} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, counterparty: v })}>
                      <SelectTrigger><SelectValue placeholder="Select counterparty" /></SelectTrigger>
                      <SelectContent>
                        <div className="p-2 border-b">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-400" />
                            <Input
                              autoFocus
                              placeholder="Search counterparties... (min 3 letters)"
                              value={cpQuery}
                              onChange={(e) => setCpQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown' && firstCpItemRef.current) {
                                  e.preventDefault()
                                  firstCpItemRef.current.focus()
                                }
                              }}
                            />
                          </div>
                        </div>
                        {(cpOptions.length ? cpOptions : counterparties).map((cp, idx) => (
                          <SelectItem
                            key={(cp as any).id}
                            value={(cp as any).id.toString()}
                            ref={idx === 0 ? (firstCpItemRef as any) : undefined}
                          >
                            {(cp as any).counterparty_name}
                          </SelectItem>
                        ))}
                        {cpHasMore && (
                          <div className="p-2">
                            <Button variant="outline" size="sm" onClick={() => loadCounterparties(cpPage + 1)} disabled={cpLoading}>
                              {cpLoading ? (
                                <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /> Loading...</span>
                              ) : 'Load more'}
                            </Button>
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Commodity</Label>
                    <Select value={dealFormCreate.commodity} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, commodity: v })}>
                      <SelectTrigger><SelectValue placeholder="Select commodity" /></SelectTrigger>
                      <SelectContent>
                        {commodities.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.commodity_name_short}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Trade Operation Type</Label>
                    <Select value={dealFormCreate.trade_operation_type} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, trade_operation_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {tradeOperationTypes.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.trade_operation_type_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sociedad</Label>
                    <Select value={dealFormCreate.sociedad} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, sociedad: v })}>
                      <SelectTrigger><SelectValue placeholder="Select sociedad" /></SelectTrigger>
                      <SelectContent>
                        {referenceData.sociedades.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.sociedad_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Delivery Format</Label>
                    <Select value={dealFormCreate.delivery_format} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, delivery_format: v })}>
                      <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                      <SelectContent>
                        {referenceData.deliveryFormats.map((f: any) => <SelectItem key={f.id} value={f.id.toString()}>{f.delivery_format_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Additive</Label>
                    <Select value={dealFormCreate.additive} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, additive: v })}>
                      <SelectTrigger><SelectValue placeholder="Select additive" /></SelectTrigger>
                      <SelectContent>
                        {referenceData.additives.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.additive_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Broker</Label>
                    <Select value={dealFormCreate.broker} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, broker: v })}>
                      <SelectTrigger><SelectValue placeholder="Select broker" /></SelectTrigger>
                      <SelectContent>
                        {referenceData.brokers.map((b: any) => <SelectItem key={b.id} value={b.id.toString()}>{b.broker_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ICOTERM</Label>
                    <Select value={dealFormCreate.icoterm} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, icoterm: v })}>
                      <SelectTrigger><SelectValue placeholder="Select incoterm" /></SelectTrigger>
                      <SelectContent>
                        {referenceData.icoterms.map((i: any) => <SelectItem key={i.id} value={i.id.toString()}>{i.icoterm_code} - {i.icoterm_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cost Center</Label>
                    <Select value={dealFormCreate.cost_center} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, cost_center: v })}>
                      <SelectTrigger><SelectValue placeholder="Select cost center" /></SelectTrigger>
                      <SelectContent>
                        {referenceData.costCenters.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.cost_center_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trade Currency</Label>
                    <Select value={dealFormCreate.trade_currency} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, trade_currency: v })}>
                      <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                      <SelectContent>
                        {currencies.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.currency_code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Broker Fee Currency</Label>
                    <Select value={dealFormCreate.broker_fee_currency} onValueChange={(v) => setDealFormCreate({ ...dealFormCreate, broker_fee_currency: v })}>
                      <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                      <SelectContent>
                        {currencies.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.currency_code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input value={dealFormCreate.price} onChange={e => setDealFormCreate({ ...dealFormCreate, price: e.target.value })} placeholder="1300.00" />
                  </div>
                  <div>
                    <Label>Forex</Label>
                    <Input value={dealFormCreate.forex} onChange={e => setDealFormCreate({ ...dealFormCreate, forex: e.target.value })} placeholder="1.0000" />
                  </div>
                  <div>
                    <Label>Broker Fee</Label>
                    <Input value={dealFormCreate.broker_fee} onChange={e => setDealFormCreate({ ...dealFormCreate, broker_fee: e.target.value })} placeholder="2.50" />
                  </div>
                  <div>
                    <Label>Freight Cost</Label>
                    <Input value={dealFormCreate.freight_cost} onChange={e => setDealFormCreate({ ...dealFormCreate, freight_cost: e.target.value })} placeholder="5.00" />
                  </div>
                  <div>
                    <Label>Payment Days</Label>
                    <Input value={dealFormCreate.payment_days} onChange={e => setDealFormCreate({ ...dealFormCreate, payment_days: e.target.value })} placeholder="30" />
                  </div>
                  <div>
                    <Label>Unit of Measure</Label>
                    <Input value={dealFormCreate.unit_of_measure} onChange={e => setDealFormCreate({ ...dealFormCreate, unit_of_measure: e.target.value })} placeholder="MT" />
                  </div>
                  <div className="col-span-2">
                    <Label>Entrega (Delivery Point)</Label>
                    <Input value={dealFormCreate.entrega} onChange={e => setDealFormCreate({ ...dealFormCreate, entrega: e.target.value })} placeholder="Delivery point" />
                  </div>
                  <div>
                    <Label>Deal Date</Label>
                    <Input type="date" value={dealFormCreate.date} onChange={e => setDealFormCreate({ ...dealFormCreate, date: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={dealFormCreate.notes} onChange={e => setDealFormCreate({ ...dealFormCreate, notes: e.target.value })} placeholder="Notes" />
                  </div>
                </div>
                {/* Delivery lines */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Delivery Periods</h3>
                    <Button type="button" variant="outline" onClick={addNextMonth}><Plus className="h-4 w-4 mr-1" /> Add Month</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealLines.map((ln, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input type="date" value={ln.delivery_period_start} onChange={e => {
                              const copy = [...dealLines]; copy[idx].delivery_period_start = e.target.value; setDealLines(copy)
                            }} />
                          </TableCell>
                          <TableCell>
                            <Input type="date" value={ln.delivery_period_end} onChange={e => {
                              const copy = [...dealLines]; copy[idx].delivery_period_end = e.target.value; setDealLines(copy)
                            }} />
                          </TableCell>
                          <TableCell>
                            <Input type="text" value={ln.quantity} onChange={e => {
                              const copy = [...dealLines]; copy[idx].quantity = e.target.value; setDealLines(copy)
                            }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDealCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save & Generate Contracts</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                <p className="text-2xl font-bold">{formatNumber(contracts.length)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(getTotalValue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {formatNumber(contracts.filter(c => c.status === 'approved' || c.status === 'executed').length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {formatNumber(contracts.filter(c => c.status === 'completed').length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {CONTRACT_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contracts ({filteredContracts.length})</span>
          </CardTitle>
          <CardDescription>
            Complete overview of all trading contracts with status tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Trader</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {Object.entries(grouped).map(([key, grp]) => (
              <React.Fragment key={key}>
                <TableRow key={`deal-${key}`} className="bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(key)}>
                          {expandedDeals[key] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <Layers className="h-4 w-4 text-primary" />
                        {grp.dealNumber}
                      </div>
                    </TableCell>
                    <TableCell>{grp.rows[0]?.counterparty_name || 'N/A'}</TableCell>
                    <TableCell>{grp.rows[0]?.trader_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(grp.rows[0]?.status || 'draft')}>
                        {(grp.rows[0]?.status || 'draft').charAt(0).toUpperCase() + (grp.rows[0]?.status || 'draft').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{grp.rows.length}</TableCell>
                    <TableCell>{formatNumber(grp.totalQuantity.toFixed(3))} MT</TableCell>
                    <TableCell>{formatNumber(grp.totalValue.toFixed(2))}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {grp.dealId ? (
                          <Button variant="outline" size="sm" onClick={() => openDealEdit(grp.dealId!)}>
                            <Edit className="h-4 w-4" /> Edit Deal
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedDeals[key] && grp.rows.map(contract => (
                    <TableRow key={contract.id}>
                      <TableCell className="pl-10">{contract.contract_number}</TableCell>
                      <TableCell>{contract.counterparty_name || 'N/A'}</TableCell>
                      <TableCell>{contract.trader_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(contract.status)}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{formatNumber(contract.quantity)} MT</TableCell>
                      <TableCell>{formatNumber((contract as any).total_value || (parseFloat(contract.price) * parseFloat(contract.quantity)))} {contract.trade_currency_code || ''}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(contract)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(contract.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
            ))}
            </TableBody>
          </Table>
          {filteredContracts.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No contracts found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Deal Dialog */}
      <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>Updating will {dealPropagate ? 'propagate to non-executed contracts' : 'not propagate changes'}.</DialogDescription>
          </DialogHeader>
          {dealEditLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm text-muted-foreground">Loading deal...</span>
            </div>
          ) : (
            <form onSubmit={handleDealSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input value={dealForm.price} onChange={e => setDealForm({ ...dealForm, price: e.target.value })} />
                </div>
                <div>
                  <Label>Forex</Label>
                  <Input value={dealForm.forex} onChange={e => setDealForm({ ...dealForm, forex: e.target.value })} />
                </div>
                <div>
                  <Label>Broker Fee</Label>
                  <Input value={dealForm.broker_fee} onChange={e => setDealForm({ ...dealForm, broker_fee: e.target.value })} />
                </div>
                <div>
                  <Label>Freight Cost</Label>
                  <Input value={dealForm.freight_cost} onChange={e => setDealForm({ ...dealForm, freight_cost: e.target.value })} />
                </div>
                <div>
                  <Label>Payment Days</Label>
                  <Input value={dealForm.payment_days} onChange={e => setDealForm({ ...dealForm, payment_days: e.target.value })} />
                </div>
                <div>
                  <Label>Unit of Measure</Label>
                  <Input value={dealForm.unit_of_measure} onChange={e => setDealForm({ ...dealForm, unit_of_measure: e.target.value })} />
                </div>
                <div>
                  <Label>Entrega</Label>
                  <Input value={dealForm.entrega} onChange={e => setDealForm({ ...dealForm, entrega: e.target.value })} />
                </div>
                <div>
                  <Label>Trade Currency</Label>
                  <Select value={dealForm.trade_currency} onValueChange={(v) => setDealForm({ ...dealForm, trade_currency: v })}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.currency_code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Format</Label>
                  <Select value={dealForm.delivery_format} onValueChange={(v) => setDealForm({ ...dealForm, delivery_format: v })}>
                    <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                    <SelectContent>
                      {referenceData.deliveryFormats.map((f: any) => <SelectItem key={f.id} value={f.id.toString()}>{f.delivery_format_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Additive</Label>
                  <Select value={dealForm.additive} onValueChange={(v) => setDealForm({ ...dealForm, additive: v })}>
                    <SelectTrigger><SelectValue placeholder="Select additive" /></SelectTrigger>
                    <SelectContent>
                      {referenceData.additives.map((a: any) => <SelectItem key={a.id} value={a.id.toString()}>{a.additive_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Broker</Label>
                  <Select value={dealForm.broker} onValueChange={(v) => setDealForm({ ...dealForm, broker: v })}>
                    <SelectTrigger><SelectValue placeholder="Select broker" /></SelectTrigger>
                    <SelectContent>
                      {referenceData.brokers.map((b: any) => <SelectItem key={b.id} value={b.id.toString()}>{b.broker_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ICOTERM</Label>
                  <Select value={dealForm.icoterm} onValueChange={(v) => setDealForm({ ...dealForm, icoterm: v })}>
                    <SelectTrigger><SelectValue placeholder="Select incoterm" /></SelectTrigger>
                    <SelectContent>
                      {referenceData.icoterms.map((i: any) => <SelectItem key={i.id} value={i.id.toString()}>{i.icoterm_code} - {i.icoterm_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cost Center</Label>
                  <Select value={dealForm.cost_center} onValueChange={(v) => setDealForm({ ...dealForm, cost_center: v })}>
                    <SelectTrigger><SelectValue placeholder="Select cost center" /></SelectTrigger>
                    <SelectContent>
                      {referenceData.costCenters.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.cost_center_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={dealForm.notes} onChange={e => setDealForm({ ...dealForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input id="propagate" type="checkbox" checked={dealPropagate} onChange={e => setDealPropagate(e.target.checked)} />
                  <Label htmlFor="propagate">Propagate changes to non-executed contracts</Label>
                </div>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDealDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Deal</Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

