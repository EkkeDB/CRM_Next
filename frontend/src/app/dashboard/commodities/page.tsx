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
import { Plus, Search, Edit, Eye, Trash2, Package, Layers, Tag } from 'lucide-react'
import { commoditiesApi, referenceDataApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Commodity } from '@/types'

interface CommodityGroup {
  id: number
  commodity_group_name: string
  description?: string
}

interface CommodityType {
  id: number
  commodity_type_name: string
  description?: string
}

interface CommoditySubtype {
  id: number
  commodity_subtype_name: string
  description?: string
}

export default function CommoditiesPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [commodityGroups, setCommodityGroups] = useState<CommodityGroup[]>([])
  const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([])
  const [commoditySubtypes, setCommoditySubtypes] = useState<CommoditySubtype[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    commodity_name_short: '',
    commodity_name_full: '',
    commodity_group: '',
    commodity_type: '',
    commodity_subtype: '',
    unit_of_measure: 'MT',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [commoditiesRes, groupsRes, typesRes, subtypesRes] = await Promise.all([
        commoditiesApi.getAll(),
        referenceDataApi.getCommodityGroups(),
        referenceDataApi.getCommodityTypes(),
        referenceDataApi.getCommoditySubtypes()
      ])

      setCommodities(commoditiesRes.results || commoditiesRes)
      setCommodityGroups(groupsRes)
      setCommodityTypes(typesRes)
      setCommoditySubtypes(subtypesRes)
    } catch (error) {
      console.error('Error fetching commodities:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch commodities',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert form data to proper types for API
      const commodityData = {
        commodity_name_short: formData.commodity_name_short,
        commodity_name_full: formData.commodity_name_full,
        commodity_group: parseInt(formData.commodity_group),
        commodity_type: parseInt(formData.commodity_type),
        commodity_subtype: parseInt(formData.commodity_subtype),
        unit_of_measure: formData.unit_of_measure
      }

      if (editingCommodity) {
        await commoditiesApi.update(editingCommodity.id, commodityData)
        toast({
          title: 'Success',
          description: 'Commodity updated successfully'
        })
      } else {
        await commoditiesApi.create(commodityData)
        toast({
          title: 'Success',
          description: 'Commodity created successfully'
        })
      }
      setDialogOpen(false)
      setEditingCommodity(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving commodity:', error)
      toast({
        title: 'Error',
        description: 'Failed to save commodity',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (commodity: Commodity) => {
    setEditingCommodity(commodity)
    setFormData({
      commodity_name_short: commodity.commodity_name_short,
      commodity_name_full: commodity.commodity_name_full || '',
      commodity_group: commodity.commodity_group?.toString() || '',
      commodity_type: commodity.commodity_type?.toString() || '',
      commodity_subtype: commodity.commodity_subtype?.toString() || '',
      unit_of_measure: commodity.unit_of_measure || 'MT',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this commodity?')) return
    
    try {
      await commoditiesApi.delete(id)
      toast({
        title: 'Success',
        description: 'Commodity deleted successfully'
      })
      fetchData()
    } catch (error) {
      console.error('Error deleting commodity:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete commodity',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      commodity_name_short: '',
      commodity_name_full: '',
      commodity_group: '',
      commodity_type: '',
      commodity_subtype: '',
      unit_of_measure: 'MT',
    })
  }

  const getCommodityGroupName = (groupId: number) => {
    const group = commodityGroups.find(g => g.id === groupId)
    return group?.commodity_group_name || 'Unknown'
  }

  const getCommodityTypeName = (typeId: number) => {
    const type = commodityTypes.find(t => t.id === typeId)
    return type?.commodity_type_name || 'Unknown'
  }

  const getCommoditySubtypeName = (subtypeId: number) => {
    const subtype = commoditySubtypes.find(s => s.id === subtypeId)
    return subtype?.commodity_subtype_name || 'Unknown'
  }

  const filteredCommodities = commodities.filter(commodity => {
    const matchesSearch = 
      commodity.commodity_name_short.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (commodity.commodity_name_full && commodity.commodity_name_full.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = 
      filterGroup === 'all' || commodity.commodity_group?.toString() === filterGroup

    return matchesSearch && matchesFilter
  })

  const getUnitOfMeasureOptions = () => [
    { value: 'MT', label: 'Metric Tons (MT)' },
    { value: 'KG', label: 'Kilograms (KG)' },
    { value: 'LB', label: 'Pounds (LB)' },
    { value: 'TON', label: 'Tons (TON)' },
    { value: 'BBL', label: 'Barrels (BBL)' },
    { value: 'GAL', label: 'Gallons (GAL)' },
    { value: 'L', label: 'Liters (L)' },
    { value: 'BU', label: 'Bushels (BU)' },
  ]

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
            Commodities
          </h1>
          <p className="text-gray-600 mt-2">Manage commodity catalog and specifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCommodity(null) }} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              New Commodity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {editingCommodity ? 'Edit Commodity' : 'Create New Commodity'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingCommodity ? 'update' : 'create'} a commodity.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commodity_name_short">Short Name *</Label>
                  <Input
                    id="commodity_name_short"
                    value={formData.commodity_name_short}
                    onChange={(e) => setFormData({ ...formData, commodity_name_short: e.target.value })}
                    required
                    placeholder="e.g., Wheat"
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                  <Select value={formData.unit_of_measure} onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getUnitOfMeasureOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="commodity_name_full">Full Name</Label>
                <Input
                  id="commodity_name_full"
                  value={formData.commodity_name_full}
                  onChange={(e) => setFormData({ ...formData, commodity_name_full: e.target.value })}
                  placeholder="e.g., Hard Red Winter Wheat"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="commodity_group">Commodity Group *</Label>
                  <Select value={formData.commodity_group} onValueChange={(value) => setFormData({ ...formData, commodity_group: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodityGroups.map(group => (
                        <SelectItem key={group.id} value={group.id.toString()}>{group.commodity_group_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="commodity_type">Commodity Type *</Label>
                  <Select value={formData.commodity_type} onValueChange={(value) => setFormData({ ...formData, commodity_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodityTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>{type.commodity_type_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="commodity_subtype">Commodity Subtype *</Label>
                  <Select value={formData.commodity_subtype} onValueChange={(value) => setFormData({ ...formData, commodity_subtype: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subtype" />
                    </SelectTrigger>
                    <SelectContent>
                      {commoditySubtypes.map(subtype => (
                        <SelectItem key={subtype.id} value={subtype.id.toString()}>{subtype.commodity_subtype_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingCommodity ? 'Update Commodity' : 'Create Commodity'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search commodities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {commodityGroups.map(group => (
                  <SelectItem key={group.id} value={group.id.toString()}>{group.commodity_group_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commodities</p>
                <p className="text-2xl font-bold">{commodities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Groups</p>
                <p className="text-2xl font-bold">{commodityGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Types</p>
                <p className="text-2xl font-bold">{commodityTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subtypes</p>
                <p className="text-2xl font-bold">{commoditySubtypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Commodities ({filteredCommodities.length})</span>
          </CardTitle>
          <CardDescription>
            Complete catalog of tradeable commodities and their specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commodity</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subtype</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommodities.map((commodity) => (
                <TableRow key={commodity.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{commodity.commodity_name_short}</div>
                      {commodity.commodity_name_full && (
                        <div className="text-sm text-muted-foreground">
                          {commodity.commodity_name_full}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {getCommodityGroupName(commodity.commodity_group)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {getCommodityTypeName(commodity.commodity_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {getCommoditySubtypeName(commodity.commodity_subtype)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {commodity.unit_of_measure}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(commodity)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(commodity.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCommodities.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No commodities found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}