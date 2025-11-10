'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import UiGuard from '@/components/security/UiGuard'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, Shuffle, TrendingUp } from 'lucide-react'
import { referenceDataApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { TradeOperationType } from '@/types'

export default function TradeOperationTypesPage() {
  const [operationTypes, setOperationTypes] = useState<TradeOperationType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOperationType, setEditingOperationType] = useState<TradeOperationType | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    trade_operation_type_name: '',
    operation_code: '',
    description: '',
    price_type: 'FLAT' as 'FLAT' | 'UNPRICED' | 'FUTURES',
    side: 'BUY' as 'BUY' | 'SELL',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await referenceDataApi.getTradeOperationTypes()
      setOperationTypes(data)
    } catch (error) {
      console.error('Error fetching trade operation types:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch trade operation types',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingOperationType) {
        await referenceDataApi.updateTradeOperationType(editingOperationType.id, {
          trade_operation_type_name: formData.trade_operation_type_name,
          operation_code: formData.operation_code,
          description: formData.description,
          price_type: formData.price_type,
          side: formData.side,
        })
        toast({ title: 'Success', description: 'Operation type updated successfully' })
      } else {
        await referenceDataApi.createTradeOperationType({
          trade_operation_type_name: formData.trade_operation_type_name,
          operation_code: formData.operation_code,
          description: formData.description,
          price_type: formData.price_type,
          side: formData.side,
        })
        toast({ title: 'Success', description: 'Operation type created successfully' })
      }
      await fetchData()
      setDialogOpen(false)
      setEditingOperationType(null)
      resetForm()
    } catch (error) {
      console.error('Error saving trade operation type:', error)
      toast({
        title: 'Error',
        description: 'Failed to save trade operation type',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (operationType: TradeOperationType) => {
    setEditingOperationType(operationType)
    setFormData({
      trade_operation_type_name: operationType.trade_operation_type_name,
      operation_code: operationType.operation_code,
      description: operationType.description,
      price_type: (operationType as any).price_type || 'FLAT',
      side: (operationType as any).side || 'BUY',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this trade operation type?')) return
    
    try {
      await referenceDataApi.deleteTradeOperationType(id)
      toast({ title: 'Success', description: 'Operation type deleted successfully' })
      await fetchData()
    } catch (error) {
      console.error('Error deleting trade operation type:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete trade operation type',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      trade_operation_type_name: '',
      operation_code: '',
      description: '',
      price_type: 'FLAT',
      side: 'BUY',
    })
  }

  const filteredOperationTypes = operationTypes.filter(operationType =>
    operationType.operation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operationType.trade_operation_type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operationType.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <UiGuard token="ui:trade_operations">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </UiGuard>
    )
  }

  return (
    <UiGuard token="ui:trade_operations">
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shuffle className="h-8 w-8 text-primary" />
            Trade Operation Types
          </h1>
          <p className="text-gray-600 mt-2">Manage types of trading operations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingOperationType(null) }} className="bg-pink-600 hover:bg-pink-700">
              <Plus className="mr-2 h-4 w-4" />
              New Operation Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                {editingOperationType ? 'Edit Operation Type' : 'Create New Operation Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="trade_operation_type_name">Operation Name *</Label>
                <Input
                  id="trade_operation_type_name"
                  value={formData.trade_operation_type_name}
                  onChange={(e) => setFormData({ ...formData, trade_operation_type_name: e.target.value })}
                  required
                  placeholder="Spot Purchase"
                />
              </div>

              <div>
                <Label htmlFor="operation_code">Operation Code</Label>
                <Input
                  id="operation_code"
                  value={formData.operation_code}
                  onChange={(e) => setFormData({ ...formData, operation_code: e.target.value.toUpperCase() })}
                  placeholder="SPOT_BUY"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the trade operation type..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_type">Price Type</Label>
                  <Select value={formData.price_type} onValueChange={(value) => setFormData({ ...formData, price_type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">FLAT</SelectItem>
                      <SelectItem value="UNPRICED">UNPRICED</SelectItem>
                      <SelectItem value="FUTURES">FUTURES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="side">Side</Label>
                  <Select value={formData.side} onValueChange={(value) => setFormData({ ...formData, side: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY">BUY</SelectItem>
                      <SelectItem value="SELL">SELL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                  {editingOperationType ? 'Update' : 'Create'}
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
              <Shuffle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Operation Types</p>
                <p className="text-2xl font-bold">{operationTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Code</p>
                <p className="text-2xl font-bold">
                  {operationTypes.filter(o => o.operation_code && o.operation_code.trim()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shuffle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Description</p>
                <p className="text-2xl font-bold">
                  {operationTypes.filter(o => o.description && o.description.trim()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search operation types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trade Operation Types ({filteredOperationTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operation Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Price Type</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperationTypes.map((operationType) => (
                <TableRow key={operationType.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <Shuffle className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <div className="font-medium">{operationType.trade_operation_type_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{operationType.operation_code || 'N/A'}</span>
                  </TableCell>
                  <TableCell>{(operationType as any).price_type || 'FLAT'}</TableCell>
                  <TableCell>{(operationType as any).side || 'BUY'}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {operationType.description || 'No description provided'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(operationType)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(operationType.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shuffle className="h-4 w-4" />
            <span>
              Trade operation type data is loaded from the database. Create/Update/Delete operations require API implementation.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
    </UiGuard>
  )
}
