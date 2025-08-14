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
import { Plus, Search, Edit, Eye, Trash2, Factory, MapPin, Building2, Activity } from 'lucide-react'
import { counterpartyFacilitiesApi, counterpartiesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { CounterpartyFacility, Counterparty } from '@/types'

const FACILITY_TYPES = [
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'port', label: 'Port' },
  { value: 'mill', label: 'Mill' },
  { value: 'processing_plant', label: 'Processing Plant' },
  { value: 'storage', label: 'Storage Facility' },
  { value: 'office', label: 'Office' },
  { value: 'distribution_center', label: 'Distribution Center' },
  { value: 'other', label: 'Other' },
]

export default function CounterpartyFacilitiesPage() {
  const [facilities, setFacilities] = useState<CounterpartyFacility[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFacility, setEditingFacility] = useState<CounterpartyFacility | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [facilityToDelete, setFacilityToDelete] = useState<{ id: number; name: string } | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    counterparty: 0,
    counterparty_facility_name: '',
    facility_type: '',
    address: '',
    city: '',
    country: '',
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.counterparty_facility_name.trim()) {
      errors.counterparty_facility_name = 'Facility name is required'
    }

    if (!formData.counterparty) {
      errors.counterparty = 'Counterparty is required'
    }

    if (!formData.facility_type) {
      errors.facility_type = 'Facility type is required'
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [facilitiesRes, counterpartiesRes] = await Promise.all([
        counterpartyFacilitiesApi.getAll(),
        counterpartiesApi.getAll()
      ])
      setFacilities(facilitiesRes.results || facilitiesRes)
      setCounterparties(counterpartiesRes.results || counterpartiesRes)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setFormErrors({})

      if (editingFacility) {
        await counterpartyFacilitiesApi.update(editingFacility.id, formData)
        toast({
          title: 'Success',
          description: 'Facility updated successfully'
        })
      } else {
        await counterpartyFacilitiesApi.create(formData)
        toast({
          title: 'Success',
          description: 'Facility created successfully'
        })
      }
      setDialogOpen(false)
      setEditingFacility(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving facility:', error)
      
      // Handle specific validation errors from the backend
      if (error.response?.status === 400 && error.response?.data) {
        const backendErrors: Record<string, string> = {}
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            backendErrors[key] = error.response.data[key][0]
          } else {
            backendErrors[key] = error.response.data[key]
          }
        })
        setFormErrors(backendErrors)
      }
      
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save facility',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (facility: CounterpartyFacility) => {
    setEditingFacility(facility)
    setFormData({
      counterparty: facility.counterparty,
      counterparty_facility_name: facility.counterparty_facility_name,
      facility_type: facility.facility_type,
      address: facility.address,
      city: facility.city,
      country: facility.country,
      is_active: facility.is_active,
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: number, name: string) => {
    setFacilityToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!facilityToDelete) return
    
    try {
      setLoading(true)
      await counterpartyFacilitiesApi.delete(facilityToDelete.id)
      toast({
        title: 'Success',
        description: `Facility "${facilityToDelete.name}" deleted successfully`
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting facility:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete facility',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setFacilityToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      counterparty: 0,
      counterparty_facility_name: '',
      facility_type: '',
      address: '',
      city: '',
      country: '',
      is_active: true,
    })
    setFormErrors({})
  }

  const getCounterpartyName = (counterpartyId: number) => {
    const counterparty = counterparties.find(cp => cp.id === counterpartyId)
    return counterparty?.counterparty_name || 'Unknown'
  }

  const getFacilityTypeLabel = (type: string) => {
    const facilityType = FACILITY_TYPES.find(ft => ft.value === type)
    return facilityType?.label || type
  }

  const getActiveStatus = (facility: CounterpartyFacility) => {
    return facility.is_active ? 'Active' : 'Inactive'
  }

  const getActiveStatusVariant = (facility: CounterpartyFacility) => {
    return facility.is_active ? 'default' : 'secondary'
  }

  const filteredFacilities = facilities.filter(facility => {
    const counterpartyName = getCounterpartyName(facility.counterparty)
    const matchesSearch = 
      facility.counterparty_facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counterpartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.country.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'active' && facility.is_active) ||
      (filterType === 'inactive' && !facility.is_active) ||
      facility.facility_type === filterType

    return matchesSearch && matchesFilter
  })

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
            <Factory className="h-8 w-8 text-primary" />
            Counterparty Facilities
          </h1>
          <p className="text-gray-600 mt-2">Manage counterparty facilities and locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingFacility(null) }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                {editingFacility ? 'Edit Facility' : 'Create New Facility'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingFacility ? 'update' : 'create'} a facility.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="counterparty">Counterparty *</Label>
                <Select 
                  value={formData.counterparty.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, counterparty: parseInt(value) })}
                >
                  <SelectTrigger className={formErrors.counterparty ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select counterparty" />
                  </SelectTrigger>
                  <SelectContent>
                    {counterparties.map(counterparty => (
                      <SelectItem key={counterparty.id} value={counterparty.id.toString()}>
                        {counterparty.counterparty_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.counterparty && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.counterparty}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="counterparty_facility_name">Facility Name *</Label>
                  <Input
                    id="counterparty_facility_name"
                    value={formData.counterparty_facility_name}
                    onChange={(e) => setFormData({ ...formData, counterparty_facility_name: e.target.value })}
                    required
                    placeholder="Enter facility name"
                    className={formErrors.counterparty_facility_name ? 'border-red-500' : ''}
                  />
                  {formErrors.counterparty_facility_name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.counterparty_facility_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="facility_type">Facility Type *</Label>
                  <Select 
                    value={formData.facility_type} 
                    onValueChange={(value) => setFormData({ ...formData, facility_type: value })}
                  >
                    <SelectTrigger className={formErrors.facility_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACILITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.facility_type && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.facility_type}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  placeholder="Full facility address"
                  className={formErrors.address ? 'border-red-500' : ''}
                />
                {formErrors.address && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City name"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country name"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="text-sm font-normal">
                  Active facility
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingFacility ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingFacility ? 'Update Facility' : 'Create Facility'
                  )}
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
              <Factory className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Facilities</p>
                <p className="text-2xl font-bold">{facilities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Facilities</p>
                <p className="text-2xl font-bold">{facilities.filter(f => f.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Counterparties</p>
                <p className="text-2xl font-bold">{new Set(facilities.map(f => f.counterparty)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">{new Set(facilities.map(f => f.country).filter(Boolean)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                placeholder="Search facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                {FACILITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} Only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Facilities ({filteredFacilities.length})</span>
            <div className="text-sm text-muted-foreground">
              {facilities.filter(f => f.is_active).length} active, {facilities.filter(f => !f.is_active).length} inactive
            </div>
          </CardTitle>
          <CardDescription>
            Complete list of counterparty facilities and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFacilities.map((facility) => (
                <TableRow key={facility.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{facility.counterparty_facility_name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {facility.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {getCounterpartyName(facility.counterparty)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getFacilityTypeLabel(facility.facility_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{facility.address}</div>
                      {(facility.city || facility.country) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[facility.city, facility.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActiveStatusVariant(facility)}>
                      {getActiveStatus(facility)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(facility)} disabled={loading}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(facility.id, facility.counterparty_facility_name)} disabled={loading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFacilities.length === 0 && (
            <div className="text-center py-8">
              <Factory className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No facilities found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Facility"
        description={
          facilityToDelete
            ? `Are you sure you want to delete "${facilityToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFacilityToDelete(null)}
      />
    </div>
  )
}