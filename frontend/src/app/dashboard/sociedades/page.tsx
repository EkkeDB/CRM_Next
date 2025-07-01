'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, Building2, TrendingUp } from 'lucide-react'
import { referenceDataApi, sociedadesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Sociedad } from '@/types'

export default function SociedadesPage() {
  const [sociedades, setSociedades] = useState<Sociedad[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSociedad, setEditingSociedad] = useState<Sociedad | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    sociedad_name: '',
    tax_id: '',
    address: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await referenceDataApi.getSociedades()
      setSociedades(data)
    } catch (error) {
      console.error('Error fetching sociedades:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch sociedades',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.sociedad_name.trim()) {
      errors.sociedad_name = 'Sociedad name is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setFormErrors({})

      if (editingSociedad) {
        await sociedadesApi.update(editingSociedad.id, formData)
        toast({
          title: 'Success',
          description: 'Sociedad updated successfully'
        })
      } else {
        await sociedadesApi.create(formData)
        toast({
          title: 'Success',
          description: 'Sociedad created successfully'
        })
      }
      setDialogOpen(false)
      setEditingSociedad(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving sociedad:', error)
      
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
        description: error.response?.data?.detail || 'Failed to save sociedad',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (sociedad: Sociedad) => {
    setEditingSociedad(sociedad)
    setFormData({
      sociedad_name: sociedad.sociedad_name,
      tax_id: sociedad.tax_id,
      address: sociedad.address
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sociedad?')) return
    
    try {
      setLoading(true)
      await sociedadesApi.delete(id)
      toast({
        title: 'Success',
        description: 'Sociedad deleted successfully'
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting sociedad:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete sociedad',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      sociedad_name: '',
      tax_id: '',
      address: ''
    })
    setFormErrors({})
  }

  const filteredSociedades = sociedades.filter(sociedad =>
    sociedad.sociedad_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sociedad.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sociedad.address.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Sociedades
          </h1>
          <p className="text-gray-600 mt-2">Manage legal entities and subsidiaries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingSociedad(null) }} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="mr-2 h-4 w-4" />
              New Sociedad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {editingSociedad ? 'Edit Sociedad' : 'Create New Sociedad'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sociedad_name">Sociedad Name *</Label>
                <Input
                  id="sociedad_name"
                  value={formData.sociedad_name}
                  onChange={(e) => setFormData({ ...formData, sociedad_name: e.target.value })}
                  required
                  placeholder="Main Trading Entity"
                  className={formErrors.sociedad_name ? 'border-red-500' : ''}
                />
                {formErrors.sociedad_name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.sociedad_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="TC123456789"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address of the legal entity..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingSociedad ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingSociedad ? 'Update Sociedad' : 'Create Sociedad'
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
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sociedades</p>
                <p className="text-2xl font-bold">{sociedades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Tax ID</p>
                <p className="text-2xl font-bold">
                  {sociedades.filter(s => s.tax_id && s.tax_id.trim()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Address</p>
                <p className="text-2xl font-bold">
                  {sociedades.filter(s => s.address && s.address.trim()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sociedades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sociedades ({filteredSociedades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sociedad Name</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSociedades.map((sociedad) => (
                <TableRow key={sociedad.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <div className="font-medium">{sociedad.sociedad_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{sociedad.tax_id || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {sociedad.address || 'No address provided'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">#{sociedad.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(sociedad)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(sociedad.id)}
                        disabled={loading}
                      >
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