'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import UiGuard from '@/components/security/UiGuard'
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
import { referenceDataApi } from '@/lib/api-client'
import type { CommoditySubtype } from '@/types'

export default function CommoditySubtypesPage() {
  const [subtypes, setSubtypes] = useState<CommoditySubtype[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubtype, setEditingSubtype] = useState<CommoditySubtype | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    commodity_subtype_name: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const subs = await referenceDataApi.getCommoditySubtypes()
      setSubtypes(subs)
    } catch (e) {
      console.error('Error loading subtypes', e)
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSubtype) {
        await referenceDataApi.updateCommoditySubtype(editingSubtype.id, {
          commodity_subtype_name: formData.commodity_subtype_name,
          description: formData.description,
        })
        toast({ title: 'Success', description: 'Commodity subtype updated successfully' })
      } else {
        await referenceDataApi.createCommoditySubtype({
          commodity_subtype_name: formData.commodity_subtype_name,
          description: formData.description,
        })
        toast({ title: 'Success', description: 'Commodity subtype created successfully' })
      }
      await fetchData()
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
      commodity_subtype_name: (subtype as any).commodity_subtype_name || '',
      description: (subtype as any).description || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this commodity subtype?')) return
    try {
      await referenceDataApi.deleteCommoditySubtype(id)
      toast({ title: 'Success', description: 'Commodity subtype deleted successfully' })
      await fetchData()
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete subtype', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      commodity_subtype_name: '',
      description: ''
    })
  }

  const filteredSubtypes = subtypes.filter((s: any) =>
    (s.commodity_subtype_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <UiGuard token="ui:commodity_subtypes">
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
                <Label htmlFor="commodity_subtype_name">Subtype Name *</Label>
                <Input
                  id="commodity_subtype_name"
                  value={(formData as any).commodity_subtype_name || ''}
                  onChange={(e) => setFormData({ ...formData, commodity_subtype_name: e.target.value })}
                  required
                  placeholder="Winter Wheat"
                />
              </div>

              {/* De-nested: no commodity type selection */}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description..."
                />
              </div>

              {/* No is_active in backend schema */}

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
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubtypes.map((subtype: any) => (
                <TableRow key={subtype.id}>
                  <TableCell>
                    <div className="font-medium">{subtype.commodity_subtype_name}</div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {subtype.description || 'No description'}
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
    </UiGuard>
  )
}
