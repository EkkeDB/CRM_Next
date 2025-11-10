'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, MapPin, Building2, Activity } from 'lucide-react'
import { contactsApi, referenceDataApi } from '@/lib/api-client'
import { counterpartiesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Contact } from '@/types'

const CONTACT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'lead', label: 'Lead' },
]

const CONTACT_SOURCES = [
  'Website', 'Referral', 'Cold Outreach', 'Trade Show', 'LinkedIn', 'Email Campaign', 'Other'
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    counterparty: '',
    position: '',
    city: '',
    country: '',
    status: 'lead' as Contact['status'],
    source: '',
    notes: ''
  })
  const [counterpartyOptions, setCounterpartyOptions] = useState<{ value: number; label: string }[]>([])
  // Async counterparty lookup for the select
  const [cpQuery, setCpQuery] = useState('')
  const [cpOptions, setCpOptions] = useState<{ value: number; label: string }[]>([])
  const [cpPage, setCpPage] = useState(1)
  const [cpHasMore, setCpHasMore] = useState(false)
  const [cpLoading, setCpLoading] = useState(false)
  const firstCpItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetchData()
    fetchCounterparties()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await contactsApi.getAll()
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch contacts',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCounterparties = async () => {
    try {
      const data = await counterpartiesApi.getAll()
      const list = (data.results || data) as any[]
      const base = list.map((cp: any) => ({ value: cp.id, label: cp.counterparty_name }))
      setCounterpartyOptions(base)
      setCpOptions(base)
    } catch (e) {
      // Soft-fail; page still works but without enforced link
      console.warn('Failed to load counterparties for contacts form')
    }
  }

  // Load counterparties for select with server-side search and paging
  const loadCounterparties = async (page = 1, reset = false) => {
    try {
      setCpLoading(true)
      const params: any = { page }
      const term = (cpQuery || '').trim()
      if (term.length >= 3) params.search = term
      const resp: any = await counterpartiesApi.getAll(params)
      const list: any[] = resp.results || resp
      const mapped = list.map((cp: any) => ({ value: cp.id, label: cp.counterparty_name }))
      const nextUrl = resp?.next
      const count = typeof resp?.count === 'number' ? resp.count : undefined
      const hasMore = Boolean(nextUrl) || (typeof count === 'number' && (page * (mapped?.length || 0)) < count)
      setCpHasMore(hasMore)
      setCpPage(page)
      setCpOptions(prev => (reset ? mapped : [...prev, ...mapped]))
    } catch {}
    finally { setCpLoading(false) }
  }

  // Debounce cpQuery
  useEffect(() => {
    const handle = setTimeout(() => {
      const term = (cpQuery || '').trim()
      if (term.length === 0) loadCounterparties(1, true)
      else if (term.length >= 3) loadCounterparties(1, true)
    }, 300)
    return () => clearTimeout(handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editingContact) {
        // Update existing contact
        const updatedContact = await contactsApi.update(editingContact.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          city: formData.city,
          country: formData.country,
          status: formData.status,
          source: formData.source,
          notes: formData.notes,
          counterparty: formData.counterparty ? parseInt(formData.counterparty) : undefined,
        })
        setContacts(contacts.map(c => c.id === editingContact.id ? updatedContact : c))
        toast({
          title: 'Success',
          description: 'Contact updated successfully'
        })
      } else {
        // Create new contact
        const newContact = await contactsApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          city: formData.city,
          country: formData.country,
          status: formData.status,
          source: formData.source,
          notes: formData.notes,
          counterparty: parseInt(formData.counterparty),
        })
        setContacts([...contacts, newContact])
        toast({
          title: 'Success',
          description: 'Contact created successfully'
        })
      }
      setDialogOpen(false)
      setEditingContact(null)
      resetForm()
    } catch (error) {
      console.error('Error saving contact:', error)
      toast({
        title: 'Error',
        description: 'Failed to save contact',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (contact: Contact) => {
    setEditLoading(true)
    setDialogOpen(true)
    try {
      const full = await contactsApi.getById(contact.id)
      setEditingContact(full)
      setFormData({
        name: full.name,
        email: full.email,
        phone: full.phone,
        counterparty: (full as any).counterparty_id?.toString?.() ?? '',
        position: full.position,
        city: full.city,
        country: full.country,
        status: full.status,
        source: full.source,
        notes: full.notes,
      })
    } catch (e) {
      console.error('Failed to load contact details', e)
      toast({ title: 'Error', description: 'Failed to load contact details', variant: 'destructive' })
    }
    setEditLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    try {
      await contactsApi.delete(id)
      setContacts(contacts.filter(c => c.id !== id))
      toast({
        title: 'Success',
        description: 'Contact deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      counterparty: '',
      position: '',
      city: '',
      country: '',
      status: 'lead',
      source: '',
      notes: ''
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'lead':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusStats = () => {
    const active = contacts.filter(c => c.status === 'active').length
    const inactive = contacts.filter(c => c.status === 'inactive').length
    const leads = contacts.filter(c => c.status === 'lead').length
    return { active, inactive, leads }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.position.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = getStatusStats()

  if (loading) {
    return (
      <UiGuard token="ui:contacts">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      </UiGuard>
    )
  }

  return (
    <UiGuard token="ui:contacts">
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Contact Management
          </h1>
          <p className="text-gray-600 mt-2">Manage business contacts and relationships</p>
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
            {editLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Loading contact...</span>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="john@company.com"
                  />
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: Contact['status']) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="counterparty">Company</Label>
                  <Select value={formData.counterparty} onValueChange={(value) => setFormData({ ...formData, counterparty: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-400" />
                          <Input
                            autoFocus
                            placeholder="Search companies... (min 3 letters)"
                            value={cpQuery}
                            onChange={(e) => setCpQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown' && firstCpItemRef.current) {
                                e.preventDefault()
                                firstCpItemRef.current.focus()
                              }
                            }}
                          />
                        </div>
                      </div>
                      {(cpOptions.length ? cpOptions : counterpartyOptions).map((opt, idx) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value.toString()}
                          ref={idx === 0 ? (firstCpItemRef as any) : undefined}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                      {cpHasMore && (
                        <div className="p-2">
                          <Button variant="outline" size="sm" onClick={() => loadCounterparties(cpPage + 1)} disabled={cpLoading}>
                            {cpLoading ? (
                              <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /> Loading...</span>
                            ) : 'Load more'}
                          </Button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
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

              <div>
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="How did you find this contact?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_SOURCES.map(source => (
                      <SelectItem key={source} value={source}>{source}</SelectItem>
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingContact ? 'Update Contact' : 'Create Contact'}
                </Button>
              </div>
            </form>
            )}
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
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads</p>
                <p className="text-2xl font-bold">{stats.leads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{new Set(contacts.map(c => c.company)).size}</p>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {CONTACT_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
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
            <span>Contacts ({filteredContacts.length})</span>
          </CardTitle>
          <CardDescription>
            Complete list of business contacts and their information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Company & Position</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Contact</TableHead>
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
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {contact.company}
                      </div>
                      <div className="text-sm text-muted-foreground">{contact.position}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.city || contact.country ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[contact.city, contact.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(contact.status)}>
                      {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{contact.source}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{new Date(contact.last_contact).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(contact.id)}>
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

      {/* Note */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              Contact data is managed through the database with full CRUD operations. All contact information is now persistent.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
    </UiGuard>
  )
}
