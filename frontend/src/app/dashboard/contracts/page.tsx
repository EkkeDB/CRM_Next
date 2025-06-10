'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Eye, Trash2, FileText, DollarSign, Calendar, Activity } from 'lucide-react'
import { contractsApi, counterpartiesApi, commoditiesApi, referenceDataApi } from '@/lib/api-client'
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
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const { toast } = useToast()

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

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      contract_number: contract.contract_number,
      counterparty: contract.counterparty.toString(),
      commodity: contract.commodity.toString(),
      trader: contract.trader.toString(),
      quantity: contract.quantity,
      price: contract.price,
      trade_currency: contract.trade_currency.toString(),
      date: contract.date,
      status: contract.status,
      trade_operation_type: contract.trade_operation_type.toString(),
      sociedad: contract.sociedad.toString(),
      delivery_format: contract.delivery_format.toString(),
      additive: contract.additive.toString(),
      broker: contract.broker.toString(),
      icoterm: contract.icoterm.toString(),
      cost_center: contract.cost_center.toString(),
      broker_fee: contract.broker_fee,
      freight_cost: contract.freight_cost,
      forex: contract.forex,
      payment_days: contract.payment_days.toString(),
      unit_of_measure: contract.unit_of_measure,
      entrega: contract.entrega || '',
      delivery_period: contract.delivery_period || '',
      notes: contract.notes || ''
    })
    setDialogOpen(true)
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingContract(null) }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          </DialogTrigger>
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
                      {counterparties.map(cp => (
                        <SelectItem key={cp.id} value={cp.id.toString()}>{cp.counterparty_name}</SelectItem>
                      ))}
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
                <TableHead>Contract #</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Trader</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Contract Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contract_number}</TableCell>
                  <TableCell>{contract.counterparty_name || 'N/A'}</TableCell>
                  <TableCell>{contract.commodity_name || 'N/A'}</TableCell>
                  <TableCell>{contract.trader_name || 'N/A'}</TableCell>
                  <TableCell>{formatNumber(contract.quantity)} MT</TableCell>
                  <TableCell>{formatCurrency(contract.price)} {contract.trade_currency_code || ''}</TableCell>
                  <TableCell>{new Date(contract.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(contract.status)}>
                      {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </Badge>
                  </TableCell>
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
    </div>
  )
}