'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, Shuffle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TradeOperationType {
  id: number
  operation_code: string
  operation_name: string
  description: string
  operation_category: 'purchase' | 'sale' | 'swap' | 'forward'
  is_active: boolean
  created_at: string
}

const mockTradeOperationTypes: TradeOperationType[] = [
  {
    id: 1,
    operation_code: 'SPOT_BUY',
    operation_name: 'Spot Purchase',
    description: 'Immediate purchase of commodities for spot delivery',
    operation_category: 'purchase',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    operation_code: 'SPOT_SELL',
    operation_name: 'Spot Sale',
    description: 'Immediate sale of commodities for spot delivery',
    operation_category: 'sale',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 3,
    operation_code: 'FWD_BUY',
    operation_name: 'Forward Purchase',
    description: 'Purchase agreement for future delivery',
    operation_category: 'forward',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 4,
    operation_code: 'FWD_SELL',
    operation_name: 'Forward Sale',
    description: 'Sale agreement for future delivery',
    operation_category: 'forward',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 5,
    operation_code: 'SWAP',
    operation_name: 'Commodity Swap',
    description: 'Exchange of one commodity for another',
    operation_category: 'swap',
    is_active: true,
    created_at: '2024-01-01'
  }
]

const categoryOptions = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'sale', label: 'Sale' },
  { value: 'swap', label: 'Swap' },
  { value: 'forward', label: 'Forward' }
]

export default function TradeOperationTypesPage() {
  const [operationTypes, setOperationTypes] = useState<TradeOperationType[]>(mockTradeOperationTypes)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingOperationType, setEditingOperationType] = useState<TradeOperationType | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    operation_code: '',
    operation_name: '',
    description: '',
    operation_category: 'purchase' as TradeOperationType['operation_category'],
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingOperationType) {
        const updated = {
          ...editingOperationType,
          ...formData,
          id: editingOperationType.id,
          created_at: editingOperationType.created_at
        }
        setOperationTypes(operationTypes.map(o => o.id === editingOperationType.id ? updated : o))
        toast({ title: 'Success', description: 'Trade operation type updated successfully' })
      } else {
        const newOperationType: TradeOperationType = {
          ...formData,
          id: Math.max(...operationTypes.map(o => o.id)) + 1,
          created_at: new Date().toISOString().split('T')[0]
        }
        setOperationTypes([...operationTypes, newOperationType])
        toast({ title: 'Success', description: 'Trade operation type created successfully' })
      }
      setDialogOpen(false)
      setEditingOperationType(null)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save trade operation type', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      operation_code: '',
      operation_name: '',
      description: '',
      operation_category: 'purchase',
      is_active: true
    })
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'purchase': return 'default'
      case 'sale': return 'secondary'
      case 'swap': return 'outline'
      case 'forward': return 'destructive'
      default: return 'outline'
    }
  }

  const filteredOperationTypes = operationTypes.filter(operationType =>
    operationType.operation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operationType.operation_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Operation Code *</Label>
                  <Input
                    value={formData.operation_code}
                    onChange={(e) => setFormData({ ...formData, operation_code: e.target.value.toUpperCase() })}
                    required
                    placeholder="SPOT_BUY"
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <select
                    value={formData.operation_category}
                    onChange={(e) => setFormData({ ...formData, operation_category: e.target.value as TradeOperationType['operation_category'] })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label>Operation Name *</Label>
                <Input
                  value={formData.operation_name}
                  onChange={(e) => setFormData({ ...formData, operation_name: e.target.value })}
                  required
                  placeholder="Spot Purchase"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the trade operation type..."
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
                <Label htmlFor="is_active">Active</Label>
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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperationTypes.map((operationType) => (
                <TableRow key={operationType.id}>
                  <TableCell className="font-medium">{operationType.operation_code}</TableCell>
                  <TableCell>{operationType.operation_name}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(operationType.operation_category)}>
                      {operationType.operation_category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {operationType.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={operationType.is_active ? "default" : "secondary"}>
                      {operationType.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingOperationType(operationType)
                        setFormData({
                          operation_code: operationType.operation_code,
                          operation_name: operationType.operation_name,
                          description: operationType.description,
                          operation_category: operationType.operation_category,
                          is_active: operationType.is_active
                        })
                        setDialogOpen(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setOperationTypes(operationTypes.filter(o => o.id !== operationType.id))
                        toast({ title: 'Success', description: 'Trade operation type deleted successfully' })
                      }}>
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
    </div>
  )
}