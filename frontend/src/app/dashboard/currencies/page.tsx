'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Currency {
  id: number
  currency_code: string
  currency_name: string
  symbol: string
  is_active: boolean
  exchange_rate: number
  created_at: string
}

// Mock data - replace with API calls
const mockCurrencies: Currency[] = [
  {
    id: 1,
    currency_code: 'USD',
    currency_name: 'US Dollar',
    symbol: '$',
    is_active: true,
    exchange_rate: 1.0,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    currency_code: 'EUR',
    currency_name: 'Euro',
    symbol: '€',
    is_active: true,
    exchange_rate: 0.85,
    created_at: '2024-01-01'
  },
  {
    id: 3,
    currency_code: 'GBP',
    currency_name: 'British Pound',
    symbol: '£',
    is_active: true,
    exchange_rate: 0.73,
    created_at: '2024-01-01'
  },
  {
    id: 4,
    currency_code: 'JPY',
    currency_name: 'Japanese Yen',
    symbol: '¥',
    is_active: true,
    exchange_rate: 110.0,
    created_at: '2024-01-01'
  },
  {
    id: 5,
    currency_code: 'CAD',
    currency_name: 'Canadian Dollar',
    symbol: 'C$',
    is_active: false,
    exchange_rate: 1.25,
    created_at: '2024-01-01'
  }
]

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>(mockCurrencies)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    currency_code: '',
    currency_name: '',
    symbol: '',
    is_active: true,
    exchange_rate: 1.0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCurrency) {
        // Update existing currency
        const updatedCurrency = {
          ...editingCurrency,
          ...formData,
          id: editingCurrency.id,
          created_at: editingCurrency.created_at
        }
        setCurrencies(currencies.map(c => c.id === editingCurrency.id ? updatedCurrency : c))
        toast({
          title: 'Success',
          description: 'Currency updated successfully'
        })
      } else {
        // Create new currency
        const newCurrency: Currency = {
          ...formData,
          id: Math.max(...currencies.map(c => c.id)) + 1,
          created_at: new Date().toISOString().split('T')[0]
        }
        setCurrencies([...currencies, newCurrency])
        toast({
          title: 'Success',
          description: 'Currency created successfully'
        })
      }
      setDialogOpen(false)
      setEditingCurrency(null)
      resetForm()
    } catch (error) {
      console.error('Error saving currency:', error)
      toast({
        title: 'Error',
        description: 'Failed to save currency',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency)
    setFormData({
      currency_code: currency.currency_code,
      currency_name: currency.currency_name,
      symbol: currency.symbol,
      is_active: currency.is_active,
      exchange_rate: currency.exchange_rate
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this currency?')) return
    
    try {
      setCurrencies(currencies.filter(c => c.id !== id))
      toast({
        title: 'Success',
        description: 'Currency deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting currency:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete currency',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      currency_code: '',
      currency_name: '',
      symbol: '',
      is_active: true,
      exchange_rate: 1.0
    })
  }

  const filteredCurrencies = currencies.filter(currency =>
    currency.currency_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.currency_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCurrencies = currencies.filter(c => c.is_active).length
  const averageRate = currencies.reduce((sum, c) => sum + c.exchange_rate, 0) / currencies.length

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Currency Management
          </h1>
          <p className="text-gray-600 mt-2">Manage currencies and exchange rates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCurrency(null) }} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              New Currency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {editingCurrency ? 'Edit Currency' : 'Create New Currency'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingCurrency ? 'update' : 'create'} a currency.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currency_code">Currency Code *</Label>
                <Input
                  id="currency_code"
                  value={formData.currency_code}
                  onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                  required
                  maxLength={3}
                  placeholder="USD"
                />
              </div>
              
              <div>
                <Label htmlFor="currency_name">Currency Name *</Label>
                <Input
                  id="currency_name"
                  value={formData.currency_name}
                  onChange={(e) => setFormData({ ...formData, currency_name: e.target.value })}
                  required
                  placeholder="US Dollar"
                />
              </div>

              <div>
                <Label htmlFor="symbol">Symbol *</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  required
                  placeholder="$"
                />
              </div>

              <div>
                <Label htmlFor="exchange_rate">Exchange Rate (to USD) *</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.0001"
                  value={formData.exchange_rate}
                  onChange={(e) => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="1.0000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active Currency</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingCurrency ? 'Update Currency' : 'Create Currency'}
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
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Currencies</p>
                <p className="text-2xl font-bold">{currencies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Currencies</p>
                <p className="text-2xl font-bold">{activeCurrencies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Base Currency</p>
                <p className="text-2xl font-bold">USD</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Exchange Rate</p>
                <p className="text-2xl font-bold">{averageRate.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Currencies ({filteredCurrencies.length})</span>
          </CardTitle>
          <CardDescription>
            Manage currency codes, names, symbols, and exchange rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Exchange Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurrencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{currency.currency_code}</span>
                    </div>
                  </TableCell>
                  <TableCell>{currency.currency_name}</TableCell>
                  <TableCell>
                    <span className="text-lg font-medium">{currency.symbol}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{currency.exchange_rate.toFixed(4)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={currency.is_active ? "default" : "secondary"}>
                      {currency.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(currency.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(currency)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(currency.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCurrencies.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No currencies found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}