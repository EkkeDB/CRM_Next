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
import { Plus, Search, Edit, Eye, Trash2, Building, Users, MapPin, Mail, Phone } from 'lucide-react'
import { counterpartiesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { Counterparty } from '@/types'

const COUNTERPARTY_TYPES = [
  { value: 'customer', label: 'Customer Only' },
  { value: 'supplier', label: 'Supplier Only' },
  { value: 'both', label: 'Customer & Supplier' },
]

export default function CounterpartiesPage() {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCounterparty, setEditingCounterparty] = useState<Counterparty | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [counterpartyToDelete, setCounterpartyToDelete] = useState<{ id: number; name: string } | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    counterparty_name: '',
    counterparty_code: '',
    tax_id: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    contact_person: '',
    is_supplier: false,
    is_customer: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.counterparty_name.trim()) {
      errors.counterparty_name = 'Company name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.is_customer && !formData.is_supplier) {
      errors.type = 'Please select at least one type (Customer or Supplier)'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await counterpartiesApi.getAll()
      setCounterparties(response.results || response)
    } catch (error) {
      console.error('Error fetching counterparties:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch counterparties',
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

      if (editingCounterparty) {
        await counterpartiesApi.update(editingCounterparty.id, formData)
        toast({
          title: 'Success',
          description: 'Counterparty updated successfully'
        })
      } else {
        await counterpartiesApi.create(formData)
        toast({
          title: 'Success',
          description: 'Counterparty created successfully'
        })
      }
      setDialogOpen(false)
      setEditingCounterparty(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving counterparty:', error)
      
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
        description: error.response?.data?.detail || 'Failed to save counterparty',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (counterparty: Counterparty) => {
    setEditingCounterparty(counterparty)
    setFormData({
      counterparty_name: counterparty.counterparty_name,
      counterparty_code: counterparty.counterparty_code || '',
      tax_id: counterparty.tax_id || '',
      city: counterparty.city || '',
      country: counterparty.country || '',
      phone: counterparty.phone || '',
      email: counterparty.email || '',
      contact_person: counterparty.contact_person || '',
      is_supplier: counterparty.is_supplier,
      is_customer: counterparty.is_customer,
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: number, name: string) => {
    setCounterpartyToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!counterpartyToDelete) return
    
    try {
      setLoading(true)
      await counterpartiesApi.delete(counterpartyToDelete.id)
      toast({
        title: 'Success',
        description: `Counterparty "${counterpartyToDelete.name}" deleted successfully`
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting counterparty:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete counterparty',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setCounterpartyToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      counterparty_name: '',
      counterparty_code: '',
      tax_id: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      contact_person: '',
      is_supplier: false,
      is_customer: true,
    })
    setFormErrors({})
  }

  const handleTypeChange = (value: string) => {
    switch (value) {
      case 'customer':
        setFormData({ ...formData, is_customer: true, is_supplier: false })
        break
      case 'supplier':
        setFormData({ ...formData, is_customer: false, is_supplier: true })
        break
      case 'both':
        setFormData({ ...formData, is_customer: true, is_supplier: true })
        break
    }
  }

  const getCounterpartyType = (counterparty: Counterparty) => {
    if (counterparty.is_customer && counterparty.is_supplier) return 'Both'
    if (counterparty.is_customer) return 'Customer'
    if (counterparty.is_supplier) return 'Supplier'
    return 'Unknown'
  }

  const getTypeBadgeVariant = (counterparty: Counterparty) => {
    if (counterparty.is_customer && counterparty.is_supplier) return 'default'
    if (counterparty.is_customer) return 'secondary'
    if (counterparty.is_supplier) return 'outline'
    return 'destructive'
  }

  const filteredCounterparties = counterparties.filter(counterparty => {
    const matchesSearch = 
      counterparty.counterparty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (counterparty.counterparty_code && counterparty.counterparty_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (counterparty.email && counterparty.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (counterparty.contact_person && counterparty.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'customer' && counterparty.is_customer) ||
      (filterType === 'supplier' && counterparty.is_supplier) ||
      (filterType === 'both' && counterparty.is_customer && counterparty.is_supplier)

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
            <Building className="h-8 w-8 text-primary" />
            Counterparties
          </h1>
          <p className="text-gray-600 mt-2">Manage customers and suppliers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCounterparty(null) }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Counterparty
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {editingCounterparty ? 'Edit Counterparty' : 'Create New Counterparty'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingCounterparty ? 'update' : 'create'} a counterparty.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="counterparty_name">Company Name *</Label>
                  <Input
                    id="counterparty_name"
                    value={formData.counterparty_name}
                    onChange={(e) => setFormData({ ...formData, counterparty_name: e.target.value })}
                    required
                    placeholder="Enter company name"
                    className={formErrors.counterparty_name ? 'border-red-500' : ''}
                  />
                  {formErrors.counterparty_name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.counterparty_name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="counterparty_code">Code</Label>
                  <Input
                    id="counterparty_code"
                    value={formData.counterparty_code}
                    onChange={(e) => setFormData({ ...formData, counterparty_code: e.target.value })}
                    placeholder="e.g., CP001"
                    className={formErrors.counterparty_code ? 'border-red-500' : ''}
                  />
                  {formErrors.counterparty_code && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.counterparty_code}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type">Counterparty Type</Label>
                <Select 
                  value={
                    formData.is_customer && formData.is_supplier ? 'both' :
                    formData.is_customer ? 'customer' : 
                    formData.is_supplier ? 'supplier' : 'customer'
                  } 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className={formErrors.type ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTERPARTY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.type && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.type}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Primary contact name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City name"
                  />
                </div>
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingCounterparty ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingCounterparty ? 'Update Counterparty' : 'Create Counterparty'
                  )}
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
                placeholder="Search counterparties..."
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
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer">Customers Only</SelectItem>
                <SelectItem value="supplier">Suppliers Only</SelectItem>
                <SelectItem value="both">Customer & Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Counterparties ({filteredCounterparties.length})</span>
            <div className="text-sm text-muted-foreground">
              {counterparties.filter(cp => cp.is_customer).length} customers, {counterparties.filter(cp => cp.is_supplier).length} suppliers
            </div>
          </CardTitle>
          <CardDescription>
            Complete list of business partners and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCounterparties.map((counterparty) => (
                <TableRow key={counterparty.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{counterparty.counterparty_name}</div>
                      {counterparty.counterparty_code && (
                        <div className="text-sm text-muted-foreground">
                          Code: {counterparty.counterparty_code}
                        </div>
                      )}
                      {counterparty.tax_id && (
                        <div className="text-sm text-muted-foreground">
                          Tax ID: {counterparty.tax_id}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(counterparty)}>
                      {getCounterpartyType(counterparty)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {counterparty.contact_person ? (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {counterparty.contact_person}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {counterparty.city || counterparty.country ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[counterparty.city, counterparty.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {counterparty.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {counterparty.email}
                        </div>
                      )}
                      {counterparty.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {counterparty.phone}
                        </div>
                      )}
                      {!counterparty.email && !counterparty.phone && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(counterparty)} disabled={loading}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(counterparty.id, counterparty.counterparty_name)} disabled={loading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCounterparties.length === 0 && (
            <div className="text-center py-8">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No counterparties found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Counterparty"
        description={
          counterpartyToDelete
            ? `Are you sure you want to delete "${counterpartyToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCounterpartyToDelete(null)}
      />
    </div>
  )
}