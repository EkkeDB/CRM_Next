'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, Globe, Ship, TrendingUp } from 'lucide-react'
import { referenceDataApi, icotermsApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { ICOTERM } from '@/types'

export default function IcotermsPage() {
  const [icoterms, setIcoterms] = useState<ICOTERM[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIcoterm, setEditingIcoterm] = useState<ICOTERM | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    icoterm_code: '',
    icoterm_name: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await referenceDataApi.getIcoterms()
      setIcoterms(data)
    } catch (error) {
      console.error('Error fetching ICOTERMS:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch ICOTERMS',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.icoterm_name.trim()) {
      errors.icoterm_name = 'ICOTERM name is required'
    }

    if (!formData.icoterm_code.trim()) {
      errors.icoterm_code = 'ICOTERM code is required'
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

      if (editingIcoterm) {
        await icotermsApi.update(editingIcoterm.id, formData)
        toast({
          title: 'Success',
          description: 'ICOTERM updated successfully'
        })
      } else {
        await icotermsApi.create(formData)
        toast({
          title: 'Success',
          description: 'ICOTERM created successfully'
        })
      }
      setDialogOpen(false)
      setEditingIcoterm(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving ICOTERM:', error)
      
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
        description: error.response?.data?.detail || 'Failed to save ICOTERM',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (icoterm: ICOTERM) => {
    setEditingIcoterm(icoterm)
    setFormData({
      icoterm_code: icoterm.icoterm_code,
      icoterm_name: icoterm.icoterm_name,
      description: icoterm.description
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ICOTERM?')) return
    
    try {
      setLoading(true)
      await icotermsApi.delete(id)
      toast({
        title: 'Success',
        description: 'ICOTERM deleted successfully'
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting ICOTERM:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete ICOTERM',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      icoterm_code: '',
      icoterm_name: '',
      description: ''
    })
    setFormErrors({})
  }

  const filteredIcoterms = icoterms.filter(icoterm =>
    icoterm.icoterm_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icoterm.icoterm_name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Globe className="h-8 w-8 text-primary" />
            ICOTERMS
          </h1>
          <p className="text-gray-600 mt-2">Manage international commercial terms</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingIcoterm(null) }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New ICOTERM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {editingIcoterm ? 'Edit ICOTERM' : 'Create New ICOTERM'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="icoterm_code">ICOTERM Code *</Label>
                <Input
                  id="icoterm_code"
                  value={formData.icoterm_code}
                  onChange={(e) => setFormData({ ...formData, icoterm_code: e.target.value.toUpperCase() })}
                  required
                  placeholder="EXW"
                  className={formErrors.icoterm_code ? 'border-red-500' : ''}
                />
                {formErrors.icoterm_code && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.icoterm_code}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="icoterm_name">ICOTERM Name *</Label>
                <Input
                  id="icoterm_name"
                  value={formData.icoterm_name}
                  onChange={(e) => setFormData({ ...formData, icoterm_name: e.target.value })}
                  required
                  placeholder="Ex Works"
                  className={formErrors.icoterm_name ? 'border-red-500' : ''}
                />
                {formErrors.icoterm_name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.icoterm_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the ICOTERM..."
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
                      {editingIcoterm ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingIcoterm ? 'Update ICOTERM' : 'Create ICOTERM'
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
              <Globe className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total ICOTERMS</p>
                <p className="text-2xl font-bold">{icoterms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ship className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Description</p>
                <p className="text-2xl font-bold">
                  {icoterms.filter(i => i.description && i.description.trim()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Recent</p>
                <p className="text-lg font-bold">
                  {icoterms.length > 0 ? icoterms[icoterms.length - 1].icoterm_code : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ICOTERMS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ICOTERMS ({filteredIcoterms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIcoterms.map((icoterm) => (
                <TableRow key={icoterm.id}>
                  <TableCell className="font-medium">{icoterm.icoterm_code}</TableCell>
                  <TableCell>{icoterm.icoterm_name}</TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {icoterm.description || 'No description provided'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">#{icoterm.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(icoterm)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(icoterm.id)}
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