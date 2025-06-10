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
import { Plus, Search, Edit, Trash2, Package, Layers, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CommodityType {
  id: number
  type_code: string
  type_name: string
  description: string
  commodity_group: string
  is_active: boolean
  commodity_count: number
  created_at: string
}

// Mock data - replace with API calls
const mockCommodityTypes: CommodityType[] = [
  {
    id: 1,
    type_code: 'PREC',
    type_name: 'Precious Metals',
    description: 'Gold, silver, platinum, and other precious metals',
    commodity_group: 'METALS',
    is_active: true,
    commodity_count: 4,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    type_code: 'BASE',
    type_name: 'Base Metals',
    description: 'Copper, aluminum, zinc, and other base metals',
    commodity_group: 'METALS',
    is_active: true,
    commodity_count: 8,
    created_at: '2024-01-01'
  },
  {
    id: 3,
    type_code: 'CRUDE',
    type_name: 'Crude Oil',
    description: 'Various grades of crude oil',
    commodity_group: 'ENERGY',
    is_active: true,
    commodity_count: 5,
    created_at: '2024-01-01'
  },
  {
    id: 4,
    type_code: 'NATGAS',
    type_name: 'Natural Gas',
    description: 'Natural gas and related products',
    commodity_group: 'ENERGY',
    is_active: true,
    commodity_count: 3,
    created_at: '2024-01-01'
  },
  {
    id: 5,
    type_code: 'GRAINS',
    type_name: 'Grains',
    description: 'Wheat, corn, rice, and other grains',
    commodity_group: 'AGRI',
    is_active: true,
    commodity_count: 12,
    created_at: '2024-01-01'
  }
]

const commodityGroupOptions = [
  { value: 'METALS', label: 'Metals' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'AGRI', label: 'Agriculture' },
  { value: 'SOFT', label: 'Soft Commodities' },
  { value: 'CHEM', label: 'Chemicals' }
]

export default function CommodityTypesPage() {
  const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>(mockCommodityTypes)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<CommodityType | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    type_code: '',
    type_name: '',
    description: '',
    commodity_group: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingType) {
        // Update existing type
        const updatedType = {
          ...editingType,
          ...formData,
          id: editingType.id,
          created_at: editingType.created_at,
          commodity_count: editingType.commodity_count
        }
        setCommodityTypes(commodityTypes.map(t => t.id === editingType.id ? updatedType : t))
        toast({
          title: 'Success',
          description: 'Commodity type updated successfully'
        })
      } else {
        // Create new type
        const newType: CommodityType = {
          ...formData,
          id: Math.max(...commodityTypes.map(t => t.id)) + 1,
          commodity_count: 0,
          created_at: new Date().toISOString().split('T')[0]
        }
        setCommodityTypes([...commodityTypes, newType])
        toast({
          title: 'Success',
          description: 'Commodity type created successfully'
        })
      }
      setDialogOpen(false)
      setEditingType(null)
      resetForm()
    } catch (error) {
      console.error('Error saving commodity type:', error)
      toast({
        title: 'Error',
        description: 'Failed to save commodity type',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (type: CommodityType) => {
    setEditingType(type)
    setFormData({
      type_code: type.type_code,
      type_name: type.type_name,
      description: type.description,
      commodity_group: type.commodity_group,
      is_active: type.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this commodity type?')) return
    
    try {
      setCommodityTypes(commodityTypes.filter(t => t.id !== id))
      toast({
        title: 'Success',
        description: 'Commodity type deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting commodity type:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete commodity type',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      type_code: '',
      type_name: '',
      description: '',
      commodity_group: '',
      is_active: true
    })
  }

  const filteredTypes = commodityTypes.filter(type =>
    type.type_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.commodity_group.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeTypes = commodityTypes.filter(t => t.is_active).length
  const totalCommodities = commodityTypes.reduce((sum, t) => sum + t.commodity_count, 0)

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Commodity Types
          </h1>
          <p className="text-gray-600 mt-2">Manage commodity type classifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingType(null) }} className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="mr-2 h-4 w-4" />
              New Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editingType ? 'Edit Commodity Type' : 'Create New Commodity Type'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingType ? 'update' : 'create'} a commodity type.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type_code">Type Code *</Label>
                <Input
                  id="type_code"
                  value={formData.type_code}
                  onChange={(e) => setFormData({ ...formData, type_code: e.target.value.toUpperCase() })}
                  required
                  placeholder="PREC"
                />
              </div>
              
              <div>
                <Label htmlFor="type_name">Type Name *</Label>
                <Input
                  id="type_name"
                  value={formData.type_name}
                  onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                  required
                  placeholder="Precious Metals"
                />
              </div>

              <div>
                <Label htmlFor="commodity_group">Commodity Group *</Label>
                <Select value={formData.commodity_group} onValueChange={(value) => setFormData({ ...formData, commodity_group: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodityGroupOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the commodity type..."
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
                <Label htmlFor="is_active">Active Type</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  {editingType ? 'Update Type' : 'Create Type'}
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
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Types</p>
                <p className="text-2xl font-bold">{commodityTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Types</p>
                <p className="text-2xl font-bold">{activeTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commodities</p>
                <p className="text-2xl font-bold">{totalCommodities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg per Type</p>
                <p className="text-2xl font-bold">
                  {commodityTypes.length > 0 ? Math.round(totalCommodities / commodityTypes.length) : 0}
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
              placeholder="Search commodity types..."
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
            <span>Commodity Types ({filteredTypes.length})</span>
          </CardTitle>
          <CardDescription>
            Manage commodity type classifications within groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Commodities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <div className="font-medium">{type.type_code}</div>
                        <div className="text-sm text-muted-foreground">{type.type_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{type.commodity_group}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {type.description || 'No description provided'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{type.commodity_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.is_active ? "default" : "secondary"}>
                      {type.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(type.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTypes.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No commodity types found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}