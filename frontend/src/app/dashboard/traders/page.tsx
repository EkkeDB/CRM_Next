'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Eye, Trash2, Users, Mail, Phone, Activity, TrendingUp } from 'lucide-react'
import { tradersApi, contractsApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Trader, Contract } from '@/types'

export default function TradersPage() {
  const [traders, setTraders] = useState<Trader[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    trader_name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tradersRes, contractsRes] = await Promise.all([
        tradersApi.getAll(),
        contractsApi.getAll()
      ])

      setTraders(tradersRes)
      setContracts(contractsRes.results || contractsRes)
    } catch (error) {
      console.error('Error fetching traders:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch traders',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTrader) {
        await tradersApi.update(editingTrader.id, formData)
        toast({
          title: 'Success',
          description: 'Trader updated successfully'
        })
      } else {
        await tradersApi.create(formData)
        toast({
          title: 'Success',
          description: 'Trader created successfully'
        })
      }
      setDialogOpen(false)
      setEditingTrader(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving trader:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save trader'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (trader: Trader) => {
    setEditingTrader(trader)
    setFormData({
      trader_name: trader.trader_name,
      email: trader.email || '',
      phone: trader.phone || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this trader?')) return
    
    try {
      await tradersApi.delete(id)
      toast({
        title: 'Success',
        description: 'Trader deleted successfully'
      })
      fetchData()
    } catch (error) {
      console.error('Error deleting trader:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete trader'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      trader_name: '',
      email: '',
      phone: '',
    })
  }

  const getTraderStats = (traderId: number) => {
    const traderContracts = contracts.filter(contract => contract.trader === traderId)
    const totalValue = traderContracts.reduce((sum, contract) => {
      return sum + (parseFloat(contract.price) * parseFloat(contract.quantity))
    }, 0)
    
    return {
      totalContracts: traderContracts.length,
      totalValue: totalValue,
      activeContracts: traderContracts.filter(c => c.status === 'approved' || c.status === 'executed').length,
      completedContracts: traderContracts.filter(c => c.status === 'completed').length
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

  const filteredTraders = traders.filter(trader =>
    trader.trader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trader.email && trader.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Users className="h-8 w-8 text-primary" />
            Traders
          </h1>
          <p className="text-gray-600 mt-2">Manage trader profiles and performance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTrader(null) }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              New Trader
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {editingTrader ? 'Edit Trader' : 'Create New Trader'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingTrader ? 'update' : 'create'} a trader profile.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="trader_name">Trader Name *</Label>
                <Input
                  id="trader_name"
                  value={formData.trader_name}
                  onChange={(e) => setFormData({ ...formData, trader_name: e.target.value })}
                  required
                  placeholder="Enter trader name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="trader@company.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingTrader ? 'Update Trader' : 'Create Trader'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
              placeholder="Search traders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Traders</p>
                <p className="text-2xl font-bold">{traders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Traders</p>
                <p className="text-2xl font-bold">
                  {traders.filter(trader => {
                    const stats = getTraderStats(trader.id)
                    return stats.activeContracts > 0
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Contracts</p>
                <p className="text-2xl font-bold">
                  {traders.length > 0 ? Math.round(contracts.length / traders.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Performer</p>
                <p className="text-lg font-bold">
                  {traders.length > 0 
                    ? traders.reduce((top, trader) => {
                        const currentStats = getTraderStats(trader.id)
                        const topStats = getTraderStats(top.id)
                        return currentStats.totalValue > topStats.totalValue ? trader : top
                      }).trader_name.split(' ')[0]
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Traders ({filteredTraders.length})</span>
          </CardTitle>
          <CardDescription>
            Trader profiles with performance metrics and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trader</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTraders.map((trader) => {
                const stats = getTraderStats(trader.id)
                return (
                  <TableRow key={trader.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">{trader.trader_name}</div>
                          <div className="text-sm text-muted-foreground">ID: {trader.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {trader.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {trader.email}
                          </div>
                        )}
                        {trader.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {trader.phone}
                          </div>
                        )}
                        {!trader.email && !trader.phone && (
                          <span className="text-muted-foreground text-sm">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalContracts}</div>
                        <div className="text-xs text-muted-foreground">
                          {stats.activeContracts} active
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold">{formatCurrency(stats.totalValue)}</div>
                        <div className="text-xs text-muted-foreground">
                          Total portfolio
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <Badge 
                          variant={stats.activeContracts > 0 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {stats.activeContracts > 0 ? "Active" : "Inactive"}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {stats.completedContracts} completed
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(trader)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(trader.id)}
                          disabled
                          title="Delete functionality not yet implemented"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredTraders.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No traders found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Note */}
      {traders.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>
                Performance metrics are calculated based on contract data. 
                Create/Edit/Delete operations require backend API implementation.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}