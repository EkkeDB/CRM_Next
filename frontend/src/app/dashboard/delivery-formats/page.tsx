"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, Truck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { referenceDataApi } from '@/lib/api-client'

interface DeliveryFormatRow {
  id: number
  delivery_format_name: string
  delivery_format_cost: string
  description: string
}

export default function DeliveryFormatsPage() {
  const [formats, setFormats] = useState<DeliveryFormatRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<DeliveryFormatRow | null>(null)
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
      const data = await referenceDataApi.getDeliveryFormats()
      setFormats(data)
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to fetch delivery formats', variant: 'destructive' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFormat) {
        await referenceDataApi.updateDeliveryFormat(editingFormat.id, formData)
        toast({ title: 'Success', description: 'Delivery format updated successfully' })
      } else {
        await referenceDataApi.createDeliveryFormat(formData)
        toast({ title: 'Success', description: 'Delivery format created successfully' })
      }
      await fetchData()
      setDialogOpen(false)
      setEditingFormat(null)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save delivery format', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({ delivery_format_name: '', delivery_format_cost: '', description: '' })
  }

  const filteredFormats = formats.filter(format =>
    format.delivery_format_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            Delivery Formats
          </h1>
          <p className="text-gray-600 mt-2">Manage delivery formats</p>
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
                <Label>Format Name *</Label>
                <Input
                  value={formData.delivery_format_name}
                  onChange={(e) => setFormData({ ...formData, delivery_format_name: e.target.value })}
                  required
                  placeholder="Bulk Vessel"
                />
              </div>

              <div>
                <Label>Cost *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.delivery_format_cost}
                  onChange={(e) => setFormData({ ...formData, delivery_format_cost: e.target.value })}
                  required
                  placeholder="25.00"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description..."
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFormats.map((format) => (
                <TableRow key={format.id}>
                  <TableCell className="font-medium">{format.delivery_format_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{format.delivery_format_cost}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {format.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingFormat(format)
                        setFormData({
                          delivery_format_name: format.delivery_format_name,
                          delivery_format_cost: format.delivery_format_cost,
                          description: format.description,
                        })
                        setDialogOpen(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={async () => {
                        await referenceDataApi.deleteDeliveryFormat(format.id)
                        toast({ title: 'Success', description: 'Delivery format deleted successfully' })
                        await fetchData()
                      }}>
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
