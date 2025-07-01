'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, Globe } from 'lucide-react'
import { currenciesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Currency } from '@/types'

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    currency_code: '',
    currency_name: '',
    currency_symbol: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await currenciesApi.getAll()
      setCurrencies(response.results || response)
    } catch (error) {
      console.error('Error fetching currencies:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch currencies',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCurrency) {
        await currenciesApi.update(editingCurrency.id, formData)
        toast({
          title: 'Success',
          description: 'Currency updated successfully'
        })
      } else {
        await currenciesApi.create(formData)
        toast({
          title: 'Success',
          description: 'Currency created successfully'
        })
      }
      setDialogOpen(false)
      setEditingCurrency(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving currency:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save currency',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency)
    setFormData({
      currency_code: currency.currency_code,
      currency_name: currency.currency_name,
      currency_symbol: currency.currency_symbol || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this currency?')) return
    
    try {
      await currenciesApi.delete(id)
      toast({
        title: 'Success',
        description: 'Currency deleted successfully'
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting currency:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete currency',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      currency_code: '',
      currency_name: '',
      currency_symbol: ''
    })
  }

  const filteredCurrencies = currencies.filter(currency =>
    currency.currency_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.currency_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                <Label htmlFor="currency_symbol">Symbol</Label>
                <Input
                  id="currency_symbol"
                  value={formData.currency_symbol}
                  onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                  placeholder="$"
                />
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
                <p className="text-sm font-medium text-muted-foreground">Major Currencies</p>
                <p className="text-2xl font-bold">
                  {currencies.filter(c => ['USD', 'EUR', 'GBP', 'JPY'].includes(c.currency_code)).length}
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">Most Recent</p>
                <p className="text-lg font-bold">
                  {currencies.length > 0 ? currencies[currencies.length - 1].currency_code : 'N/A'}
                </p>
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
            Manage currency codes, names, and symbols for trading operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
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
                    <span className="text-lg font-medium">{currency.currency_symbol || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(currency)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(currency.id)}
                      >
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

      {/* Note */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>
              Currency data is loaded from the database with full CRUD operations available.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}