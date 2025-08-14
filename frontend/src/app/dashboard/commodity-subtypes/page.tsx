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
import { commoditySubtypesApi, commodityTypesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { CommoditySubtype, CommodityType } from '@/types'

export default function CommoditySubtypesPage() {
  const [commoditySubtypes, setCommoditySubtypes] = useState<CommoditySubtype[]>([])
  const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSubtype, setEditingSubtype] = useState<CommoditySubtype | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    commodity_subtype_name: '',
    commodity_type: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subtypesData, typesData] = await Promise.all([
        commoditySubtypesApi.getAll(),
        commodityTypesApi.getAll()
      ])
      setCommoditySubtypes(subtypesData.results || subtypesData)
      setCommodityTypes(typesData.results || typesData)
    } catch (error) {
      console.error('Error fetching commodity subtypes:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch commodity subtypes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const requestData = {
        commodity_subtype_name: formData.commodity_subtype_name,
        commodity_type: parseInt(formData.commodity_type),
        description: formData.description
      }

      if (editingSubtype) {
        // Update existing commodity subtype
        await commoditySubtypesApi.update(editingSubtype.id, requestData)
        toast({
          title: 'Success',
          description: 'Commodity subtype updated successfully',
          variant: 'default'
        })
      } else {
        // Create new commodity subtype
        await commoditySubtypesApi.create(requestData)
        toast({
          title: 'Success',
          description: 'Commodity subtype created successfully',
          variant: 'default'
        })
      }
      
      // Refresh the list
      await fetchData()
      setDialogOpen(false)
      setEditingSubtype(null)
      resetForm()
    } catch (error) {
      console.error('Error saving commodity subtype:', error)
      toast({
        title: 'Error',
        description: 'Failed to save commodity subtype',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (subtype: CommoditySubtype) => {
    setEditingSubtype(subtype)
    setFormData({
      commodity_subtype_name: subtype.commodity_subtype_name,
      commodity_type: subtype.commodity_type.toString(),
      description: subtype.description
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this commodity subtype?')) return
    
    try {
      await commoditySubtypesApi.delete(id)
      toast({
        title: 'Success',
        description: 'Commodity subtype deleted successfully',
        variant: 'default'
      })
      // Refresh the list
      await fetchData()
    } catch (error) {
      console.error('Error deleting commodity subtype:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete commodity subtype',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      commodity_subtype_name: '',
      commodity_type: '',
      description: ''
    })
  }

  const filteredSubtypes = commoditySubtypes.filter(subtype =>
    subtype.commodity_subtype_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subtype.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subtype.commodity_type_name && subtype.commodity_type_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Package className="h-8 w-8 text-primary" />
            Commodity Subtypes
          </h1>
          <p className="text-gray-600 mt-2">Manage detailed commodity subtype classifications</p>
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
                {editingSubtype ? 'Edit Commodity Subtype' : 'Create New Commodity Subtype'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingSubtype ? 'update' : 'create'} a commodity subtype.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="commodity_subtype_name">Subtype Name *</Label>
                <Input
                  id="commodity_subtype_name"
                  value={formData.commodity_subtype_name}
                  onChange={(e) => setFormData({ ...formData, commodity_subtype_name: e.target.value })}
                  required
                  placeholder="Gold Bullion"
                />
              </div>

              <div>
                <Label htmlFor="commodity_type">Commodity Type *</Label>
                <Select value={formData.commodity_type} onValueChange={(value) => setFormData({ ...formData, commodity_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodityTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.commodity_type_name}
                      </SelectItem>
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
                  placeholder="Description of the commodity subtype..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                  {editingSubtype ? 'Update Subtype' : 'Create Subtype'}
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
                <p className="text-sm font-medium text-muted-foreground">Total Subtypes</p>
                <p className="text-2xl font-bold">{commoditySubtypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-8 w-8 text-green-600" />
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
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Description</p>
                <p className="text-2xl font-bold">
                  {commoditySubtypes.filter(s => s.description && s.description.trim()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hierarchy</p>
                <p className="text-2xl font-bold">Nested</p>
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
              placeholder="Search commodity subtypes..."
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
            <span>Commodity Subtypes ({filteredSubtypes.length})</span>
          </CardTitle>
          <CardDescription>
            Manage commodity subtype classifications within types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subtype Name</TableHead>
                <TableHead>Commodity Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubtypes.map((subtype) => (
                <TableRow key={subtype.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="font-medium">{subtype.commodity_subtype_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subtype.commodity_type_name || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {subtype.description || 'No description provided'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">#{subtype.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(subtype)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(subtype.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSubtypes.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No commodity subtypes found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              Commodity subtype data is loaded from the database with proper hierarchy linking to independent commodity types. Full CRUD operations are available.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}