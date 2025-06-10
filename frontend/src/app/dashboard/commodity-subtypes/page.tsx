'use client'

import { useState } from 'react'
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

interface CommoditySubtype {
  id: number
  subtype_code: string
  subtype_name: string
  description: string
  commodity_type: string
  commodity_group: string
  is_active: boolean
  created_at: string
}

const mockCommoditySubtypes: CommoditySubtype[] = [
  {
    id: 1,
    subtype_code: 'GOLD',
    subtype_name: 'Gold',
    description: 'Physical gold and gold-based instruments',
    commodity_type: 'PREC',
    commodity_group: 'METALS',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    subtype_code: 'SILVER',
    subtype_name: 'Silver',
    description: 'Physical silver and silver-based instruments',
    commodity_type: 'PREC',
    commodity_group: 'METALS',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 3,
    subtype_code: 'COPPER',
    subtype_name: 'Copper',
    description: 'Copper wire, cathode, and other copper products',
    commodity_type: 'BASE',
    commodity_group: 'METALS',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 4,
    subtype_code: 'WTI',
    subtype_name: 'WTI Crude',
    description: 'West Texas Intermediate crude oil',
    commodity_type: 'CRUDE',
    commodity_group: 'ENERGY',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 5,
    subtype_code: 'BRENT',
    subtype_name: 'Brent Crude',
    description: 'Brent crude oil from North Sea',
    commodity_type: 'CRUDE',
    commodity_group: 'ENERGY',
    is_active: true,
    created_at: '2024-01-01'
  }
]

const commodityTypeOptions = [
  { value: 'PREC', label: 'Precious Metals' },
  { value: 'BASE', label: 'Base Metals' },
  { value: 'CRUDE', label: 'Crude Oil' },
  { value: 'NATGAS', label: 'Natural Gas' },
  { value: 'GRAINS', label: 'Grains' }
]

export default function CommoditySubtypesPage() {
  const [subtypes, setSubtypes] = useState<CommoditySubtype[]>(mockCommoditySubtypes)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubtype, setEditingSubtype] = useState<CommoditySubtype | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    subtype_code: '',
    subtype_name: '',
    description: '',
    commodity_type: '',
    commodity_group: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSubtype) {
        const updatedSubtype = {
          ...editingSubtype,
          ...formData,
          id: editingSubtype.id,
          created_at: editingSubtype.created_at
        }
        setSubtypes(subtypes.map(s => s.id === editingSubtype.id ? updatedSubtype : s))
        toast({ title: 'Success', description: 'Commodity subtype updated successfully' })
      } else {
        const newSubtype: CommoditySubtype = {
          ...formData,
          id: Math.max(...subtypes.map(s => s.id)) + 1,
          created_at: new Date().toISOString().split('T')[0]
        }
        setSubtypes([...subtypes, newSubtype])
        toast({ title: 'Success', description: 'Commodity subtype created successfully' })
      }
      setDialogOpen(false)
      setEditingSubtype(null)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save commodity subtype', variant: 'destructive' })
    }
  }

  const handleEdit = (subtype: CommoditySubtype) => {
    setEditingSubtype(subtype)
    setFormData({
      subtype_code: subtype.subtype_code,
      subtype_name: subtype.subtype_name,
      description: subtype.description,
      commodity_type: subtype.commodity_type,
      commodity_group: subtype.commodity_group,
      is_active: subtype.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this commodity subtype?')) return
    setSubtypes(subtypes.filter(s => s.id !== id))
    toast({ title: 'Success', description: 'Commodity subtype deleted successfully' })
  }

  const resetForm = () => {
    setFormData({
      subtype_code: '',
      subtype_name: '',
      description: '',
      commodity_type: '',
      commodity_group: '',
      is_active: true
    })
  }

  const filteredSubtypes = subtypes.filter(subtype =>
    subtype.subtype_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subtype.subtype_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subtype.commodity_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Commodity Subtypes
          </h1>
          <p className="text-gray-600 mt-2">Manage detailed commodity classifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingSubtype(null) }} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              New Subtype
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editingSubtype ? 'Edit Subtype' : 'Create New Subtype'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subtype_code">Subtype Code *</Label>
                <Input
                  id="subtype_code"
                  value={formData.subtype_code}
                  onChange={(e) => setFormData({ ...formData, subtype_code: e.target.value.toUpperCase() })}
                  required
                  placeholder="GOLD"
                />
              </div>
              
              <div>
                <Label htmlFor="subtype_name">Subtype Name *</Label>
                <Input
                  id="subtype_name"
                  value={formData.subtype_name}
                  onChange={(e) => setFormData({ ...formData, subtype_name: e.target.value })}
                  required
                  placeholder="Gold"
                />
              </div>

              <div>
                <Label htmlFor="commodity_type">Commodity Type *</Label>
                <Select value={formData.commodity_type} onValueChange={(value) => setFormData({ ...formData, commodity_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodityTypeOptions.map(option => (
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
                  placeholder="Description..."
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
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                  {editingSubtype ? 'Update' : 'Create'}
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
              placeholder="Search subtypes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commodity Subtypes ({filteredSubtypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subtype</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubtypes.map((subtype) => (
                <TableRow key={subtype.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subtype.subtype_code}</div>
                      <div className="text-sm text-muted-foreground">{subtype.subtype_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subtype.commodity_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {subtype.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={subtype.is_active ? "default" : "secondary"}>
                      {subtype.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(subtype)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(subtype.id)}>
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