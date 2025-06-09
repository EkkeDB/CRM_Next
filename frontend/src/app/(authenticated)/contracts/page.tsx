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
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

interface Contract {
  id: number
  contract_number: string
  counterparty: {
    id: number
    name: string
  }
  commodity: {
    id: number
    name: string
  }
  trader: {
    id: number
    name: string
  }
  quantity: string
  price_per_unit: string
  currency: {
    id: number
    code: string
  }
  delivery_date: string
  status: string
  trade_operation_type: {
    id: number
    name: string
  }
  created_at: string
  updated_at: string
}

interface Counterparty {
  id: number
  name: string
}

interface Commodity {
  id: number
  name: string
}

interface Trader {
  id: number
  name: string
}

interface Currency {
  id: number
  code: string
}

interface TradeOperationType {
  id: number
  name: string
}

const CONTRACT_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [traders, setTraders] = useState<Trader[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [tradeOperationTypes, setTradeOperationTypes] = useState<TradeOperationType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    contract_number: '',
    counterparty: '',
    commodity: '',
    trader: '',
    quantity: '',
    price_per_unit: '',
    currency: '',
    delivery_date: '',
    status: 'DRAFT',
    trade_operation_type: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contractsRes, counterpartiesRes, commoditiesRes, tradersRes, currenciesRes, tradeTypesRes] = await Promise.all([
        apiClient.get('/api/contracts/'),
        apiClient.get('/api/counterparties/'),
        apiClient.get('/api/commodities/'),
        apiClient.get('/api/traders/'),
        apiClient.get('/api/currencies/'),
        apiClient.get('/api/trade-operation-types/')
      ])

      setContracts(contractsRes.data.results || contractsRes.data)
      setCounterparties(counterpartiesRes.data.results || counterpartiesRes.data)
      setCommodities(commoditiesRes.data.results || commoditiesRes.data)
      setTraders(tradersRes.data.results || tradersRes.data)
      setCurrencies(currenciesRes.data.results || currenciesRes.data)
      setTradeOperationTypes(tradeTypesRes.data.results || tradeTypesRes.data)
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
      if (editingContract) {
        await apiClient.put(`/api/contracts/${editingContract.id}/`, formData)
        toast({
          title: 'Success',
          description: 'Contract updated successfully'
        })
      } else {
        await apiClient.post('/api/contracts/', formData)
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
      counterparty: contract.counterparty.id.toString(),
      commodity: contract.commodity.id.toString(),
      trader: contract.trader.id.toString(),
      quantity: contract.quantity,
      price_per_unit: contract.price_per_unit,
      currency: contract.currency.id.toString(),
      delivery_date: contract.delivery_date,
      status: contract.status,
      trade_operation_type: contract.trade_operation_type.id.toString(),
      notes: ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contract?')) return
    
    try {
      await apiClient.delete(`/api/contracts/${id}/`)
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
      price_per_unit: '',
      currency: '',
      delivery_date: '',
      status: 'DRAFT',
      trade_operation_type: '',
      notes: ''
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'COMPLETED':
        return 'secondary'
      case 'CANCELLED':
        return 'destructive'
      case 'PENDING':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const filteredContracts = contracts.filter(contract =>
    contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.counterparty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.commodity.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contract Management</h1>
          <p className="text-gray-600 mt-2">Manage commodity trading contracts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingContract(null) }}>
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContract ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
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
                        <SelectItem key={cp.id} value={cp.id.toString()}>{cp.name}</SelectItem>
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
                        <SelectItem key={commodity.id} value={commodity.id.toString()}>{commodity.name}</SelectItem>
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
                        <SelectItem key={trader.id} value={trader.id.toString()}>{trader.name}</SelectItem>
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
                        <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
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
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_unit">Price per Unit</Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.id} value={currency.id.toString()}>{currency.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContract ? 'Update Contract' : 'Create Contract'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
          <CardDescription>
            Overview of all trading contracts
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
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
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contract_number}</TableCell>
                  <TableCell>{contract.counterparty.name}</TableCell>
                  <TableCell>{contract.commodity.name}</TableCell>
                  <TableCell>{contract.trader.name}</TableCell>
                  <TableCell>{contract.quantity}</TableCell>
                  <TableCell>{contract.price_per_unit} {contract.currency.code}</TableCell>
                  <TableCell>{new Date(contract.delivery_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(contract.status)}>
                      {contract.status}
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
              <p className="text-gray-500">No contracts found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}