'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, Briefcase, Building2, TrendingUp } from 'lucide-react'
import { referenceDataApi, costCentersApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { CostCenter } from '@/types'

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    cost_center_name: '',
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
      const data = await referenceDataApi.getCostCenters()
      setCostCenters(data)
    } catch (error) {
      console.error('Error fetching cost centers:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch cost centers',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.cost_center_name.trim()) {
      errors.cost_center_name = 'Cost center name is required'
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

      if (editingCostCenter) {
        await costCentersApi.update(editingCostCenter.id, formData)
        toast({
          title: 'Success',
          description: 'Cost center updated successfully'
        })
      } else {
        await costCentersApi.create(formData)
        toast({
          title: 'Success',
          description: 'Cost center created successfully'
        })
      }
      setDialogOpen(false)
      setEditingCostCenter(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving cost center:', error)
      
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
        description: error.response?.data?.detail || 'Failed to save cost center',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter)
    setFormData({
      cost_center_name: costCenter.cost_center_name,
      description: costCenter.description
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cost center?')) return
    
    try {
      setLoading(true)
      await costCentersApi.delete(id)
      toast({
        title: 'Success',
        description: 'Cost center deleted successfully'
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting cost center:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete cost center',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      cost_center_name: '',
      description: ''
    })
    setFormErrors({})
  }

  const filteredCostCenters = costCenters.filter(center =>
    center.cost_center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.description.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Briefcase className="h-8 w-8 text-primary" />
            Cost Centers
          </h1>
          <p className="text-gray-600 mt-2">Manage cost centers and budget allocation</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCostCenter(null) }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              New Cost Center
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {editingCostCenter ? 'Edit Cost Center' : 'Create New Cost Center'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingCostCenter ? 'update' : 'create'} a cost center.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cost_center_name">Cost Center Name *</Label>
                <Input
                  id="cost_center_name"
                  value={formData.cost_center_name}
                  onChange={(e) => setFormData({ ...formData, cost_center_name: e.target.value })}
                  required
                  placeholder="Trading Operations"
                  className={formErrors.cost_center_name ? 'border-red-500' : ''}
                />
                {formErrors.cost_center_name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.cost_center_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of cost center activities..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingCostCenter ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingCostCenter ? 'Update Cost Center' : 'Create Cost Center'
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
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost Centers</p>
                <p className="text-2xl font-bold">{costCenters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Description</p>
                <p className="text-2xl font-bold">
                  {costCenters.filter(c => c.description && c.description.trim()).length}
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
                  {costCenters.length > 0 ? costCenters[costCenters.length - 1].cost_center_name : 'N/A'}
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

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cost centers..."
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
            <span>Cost Centers ({filteredCostCenters.length})</span>
          </CardTitle>
          <CardDescription>
            Manage cost centers, budgets, and departmental allocations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost Center Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCostCenters.map((center) => (
                <TableRow key={center.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">{center.cost_center_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {center.description || 'No description provided'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">#{center.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(center)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(center.id)}
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
          {filteredCostCenters.length === 0 && (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No cost centers found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}