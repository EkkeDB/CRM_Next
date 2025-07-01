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
import { Plus, Search, Edit, Trash2, Truck } from 'lucide-react'
import { deliveryFormatsApi } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export default function DeliveryFormatsPage() {
  const [formats, setFormats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<any | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    delivery_format_name: '',
    delivery_format_cost: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await deliveryFormatsApi.getAll()
      setFormats(response.results || response)
    } catch (error) {
      console.error('Error fetching delivery formats:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch delivery formats',
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
        delivery_format_cost: parseFloat(formData.delivery_format_cost) || 0
      }

      if (editingFormat) {
        await deliveryFormatsApi.update(editingFormat.id, submitData)
        toast({
          title: 'Success',
          description: 'Delivery format updated successfully'
        })
      } else {
        await deliveryFormatsApi.create(submitData)
        toast({
          title: 'Success',
          description: 'Delivery format created successfully'
        })
      }
      setDialogOpen(false)
      setEditingFormat(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error('Error saving delivery format:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save delivery format',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      delivery_format_name: '',
      delivery_format_cost: '',
      description: ''
    })
  }

  const handleEdit = (format: any) => {
    setEditingFormat(format)
    setFormData({
      delivery_format_name: format.delivery_format_name,
      delivery_format_cost: format.delivery_format_cost?.toString() || '0',
      description: format.description || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this delivery format?')) return
    
    try {
      await deliveryFormatsApi.delete(id)
      toast({
        title: 'Success',
        description: 'Delivery format deleted successfully'
      })
      fetchData()
    } catch (error: any) {
      console.error('Error deleting delivery format:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete delivery format',
        variant: 'destructive'
      })
    }
  }

  const filteredFormats = formats.filter(format =>
    format.delivery_format_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (format.description && format.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Truck className="h-8 w-8 text-primary" />
            Delivery Formats
          </h1>
          <p className="text-gray-600 mt-2">Manage delivery and transport formats</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingFormat(null) }} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              New Format
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {editingFormat ? 'Edit Format' : 'Create New Format'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="delivery_format_name">Format Name *</Label>
                <Input
                  id="delivery_format_name"
                  value={formData.delivery_format_name}
                  onChange={(e) => setFormData({ ...formData, delivery_format_name: e.target.value })}
                  required
                  placeholder="Bulk Cargo"
                />
              </div>
              
              <div>
                <Label htmlFor="delivery_format_cost">Cost *</Label>
                <Input
                  id="delivery_format_cost"
                  type="number"
                  step="0.01"
                  value={formData.delivery_format_cost}
                  onChange={(e) => setFormData({ ...formData, delivery_format_cost: e.target.value })}
                  required
                  placeholder="50.00"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the delivery format..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {editingFormat ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search delivery formats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Formats ({filteredFormats.length})</CardTitle>
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
              {filteredFormats.map((format) => (
                <TableRow key={format.id}>
                  <TableCell className="font-medium">{format.delivery_format_name}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600">
                      ${format.delivery_format_cost ? parseFloat(format.delivery_format_cost.toString()).toFixed(2) : '0.00'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">
                      {format.description || 'No description provided'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format.created_at ? new Date(format.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(format)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(format.id)}>
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