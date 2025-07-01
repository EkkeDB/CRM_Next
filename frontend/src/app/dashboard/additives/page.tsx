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
import { Plus, Search, Edit, Trash2, Beaker, TrendingUp } from 'lucide-react'
import { additivesApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import type { Additive } from '@/types'

export default function AdditivesPage() {
  const [additives, setAdditives] = useState<Additive[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAdditive, setEditingAdditive] = useState<Additive | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    additive_name: '',
    additive_cost: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await additivesApi.getAll()
      setAdditives(response.results || response)
    } catch (error) {
      console.error('Error fetching additives:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch additives',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        additive_cost: parseFloat(formData.additive_cost) || 0
      }
      
      if (editingAdditive) {
        await additivesApi.update(editingAdditive.id, submitData)
        toast({
          title: 'Success',
          description: 'Additive updated successfully'
        })
      } else {
        await additivesApi.create(submitData)
        toast({
          title: 'Success',
          description: 'Additive created successfully'
        })
      }
      
      setDialogOpen(false)
      setEditingAdditive(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving additive:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save additive',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (additive: Additive) => {
    setEditingAdditive(additive)
    setFormData({
      additive_name: additive.additive_name,
      additive_cost: additive.additive_cost?.toString() || '0',
      description: additive.description || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this additive?')) return
    
    try {
      await additivesApi.delete(id)
      toast({
        title: 'Success',
        description: 'Additive deleted successfully'
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting additive:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete additive',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({ additive_name: '', additive_cost: '', description: '' })
  }

  const filteredAdditives = additives.filter(additive =>
    additive.additive_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (additive.description && additive.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Beaker className="h-8 w-8 text-primary" />
            Additives
          </h1>
          <p className="text-gray-600 mt-2">Manage commodity additives and treatments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingAdditive(null) }} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              New Additive
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                {editingAdditive ? 'Edit Additive' : 'Create New Additive'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingAdditive ? 'update' : 'create'} an additive.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="additive_name">Additive Name *</Label>
                <Input
                  id="additive_name"
                  value={formData.additive_name}
                  onChange={(e) => setFormData({ ...formData, additive_name: e.target.value })}
                  required
                  placeholder="Anti-corrosive"
                />
              </div>
              <div>
                <Label htmlFor="additive_cost">Cost *</Label>
                <Input
                  id="additive_cost"
                  type="number"
                  step="0.01"
                  value={formData.additive_cost}
                  onChange={(e) => setFormData({ ...formData, additive_cost: e.target.value })}
                  required
                  placeholder="25.50"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the additive..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingAdditive ? 'Update' : 'Create'}
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
              <Beaker className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Additives</p>
                <p className="text-2xl font-bold">{additives.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Cost</p>
                <p className="text-2xl font-bold">
                  ${additives.length > 0 ? (additives.reduce((sum, a) => sum + (parseFloat(a.additive_cost?.toString() || '0') || 0), 0) / additives.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Beaker className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Description</p>
                <p className="text-2xl font-bold">
                  {additives.filter(a => a.description && a.description.trim()).length}
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
                <p className="text-2xl font-bold">Operational</p>
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
              placeholder="Search additives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additives ({filteredAdditives.length})</CardTitle>
          <CardDescription>
            Manage commodity additives and chemical treatments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdditives.map((additive) => (
                <TableRow key={additive.id}>
                  <TableCell className="font-medium">{additive.additive_name}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      ${additive.additive_cost ? parseFloat(additive.additive_cost.toString()).toFixed(2) : '0.00'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {additive.description || 'No description provided'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {additive.created_at ? new Date(additive.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(additive)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(additive.id)}
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

      {/* Note */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Beaker className="h-4 w-4" />
            <span>
              Additive data is loaded from the database with full CRUD operations available.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}