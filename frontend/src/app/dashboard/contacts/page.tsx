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
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, Building2, Activity, UserCheck } from 'lucide-react'
import { contactsApi, counterpartiesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { Contact, Counterparty } from '@/types'

const DEPARTMENTS = [
  'Sales', 'Purchasing', 'Operations', 'Finance', 'Legal', 'Management', 'Logistics', 'Quality', 'Other'
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [counterpartyFilter, setCounterpartyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<{ id: number; name: string } | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    counterparty: 0,
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    notes: '',
    is_primary: false,
    is_active: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.counterparty) {
      errors.counterparty = 'Counterparty is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contactsRes, counterpartiesRes] = await Promise.all([
        contactsApi.getAll(),
        counterpartiesApi.getAll()
      ])
      setContacts(contactsRes.results || contactsRes)
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

      if (editingContact) {
        await contactsApi.update(editingContact.id, formData)
        toast({
          title: 'Success',
          description: 'Contact updated successfully'
        })
      } else {
        await contactsApi.create(formData)
        toast({
          title: 'Success',
          description: 'Contact created successfully'
        })
      }
      setDialogOpen(false)
      setEditingContact(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving contact:', error)
      
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
        description: error.response?.data?.detail || 'Failed to save contact',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      counterparty: contact.counterparty,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      department: contact.department || '',
      notes: contact.notes || '',
      is_primary: contact.is_primary,
      is_active: contact.is_active,
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: number, name: string) => {
    setContactToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return
    
    try {
      setLoading(true)
      await contactsApi.delete(contactToDelete.id)
      toast({
        title: 'Success',
        description: `Contact "${contactToDelete.name}" deleted successfully`
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete contact',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setContactToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      counterparty: 0,
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      notes: '',
      is_primary: false,
      is_active: true,
    })
    setFormErrors({})
  }

  const getCounterpartyName = (counterpartyId: number, contact?: Contact) => {
    const counterparty = counterparties.find(cp => cp.id === counterpartyId)
    return counterparty?.counterparty_name || contact?.counterparty_name || 'Unknown'
  }

  const getStatusBadgeVariant = (contact: Contact) => {
    if (contact.is_primary && contact.is_active) return 'default'
    if (contact.is_active) return 'secondary'
    return 'outline'
  }

  const getStatusLabel = (contact: Contact) => {
    if (!contact.is_active) return 'Inactive'
    if (contact.is_primary) return 'Primary'
    return 'Active'
  }

  const filteredContacts = contacts.filter(contact => {
    const counterpartyName = getCounterpartyName(contact.counterparty, contact)
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counterpartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.department && contact.department.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCounterparty = 
      counterpartyFilter === 'all' || 
      contact.counterparty.toString() === counterpartyFilter

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && contact.is_active) ||
      (statusFilter === 'inactive' && !contact.is_active) ||
      (statusFilter === 'primary' && contact.is_primary)

    return matchesSearch && matchesCounterparty && matchesStatus
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
            <Users className="h-8 w-8 text-primary" />
            Contacts
          </h1>
          <p className="text-gray-600 mt-2">Manage counterparty contacts and relationships</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingContact(null) }} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {editingContact ? 'Edit Contact' : 'Create New Contact'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingContact ? 'update' : 'create'} a contact.
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
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
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
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Job Title"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this contact..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_primary" className="text-sm font-normal">
                    Primary contact for this counterparty
                  </Label>
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
                    Active contact
                  </Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingContact ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingContact ? 'Update Contact' : 'Create Contact'
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
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Contacts</p>
                <p className="text-2xl font-bold">{contacts.filter(c => c.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Primary Contacts</p>
                <p className="text-2xl font-bold">{contacts.filter(c => c.is_primary).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Counterparties</p>
                <p className="text-2xl font-bold">{new Set(contacts.map(c => c.counterparty)).size}</p>
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
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={counterpartyFilter} onValueChange={setCounterpartyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by counterparty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counterparties</SelectItem>
                {counterparties.map(counterparty => (
                  <SelectItem key={counterparty.id} value={counterparty.id.toString()}>
                    {counterparty.counterparty_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="primary">Primary Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contacts ({filteredContacts.length})</span>
            <div className="text-sm text-muted-foreground">
              {contacts.filter(c => c.is_active).length} active, {contacts.filter(c => c.is_primary).length} primary
            </div>
          </CardTitle>
          <CardDescription>
            Complete list of counterparty contacts and their information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Position & Department</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {contact.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {getCounterpartyName(contact.counterparty, contact)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {contact.position && (
                        <div className="font-medium">{contact.position}</div>
                      )}
                      {contact.department && (
                        <div className="text-sm text-muted-foreground">{contact.department}</div>
                      )}
                      {!contact.position && !contact.department && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {contact.phone}
                        </div>
                      )}
                      {!contact.email && !contact.phone && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(contact)}>
                      {getStatusLabel(contact)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(contact)} disabled={loading}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(contact.id, contact.name)} disabled={loading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredContacts.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No contacts found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contact"
        description={
          contactToDelete
            ? `Are you sure you want to delete "${contactToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setContactToDelete(null)}
      />
    </div>
  )
}