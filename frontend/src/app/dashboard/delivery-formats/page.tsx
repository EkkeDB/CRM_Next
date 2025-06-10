'use client'

import { useState } from 'react'
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

interface DeliveryFormat {
  id: number
  format_code: string
  format_name: string
  description: string
  transport_mode: string
  is_active: boolean
  created_at: string
}

const mockDeliveryFormats: DeliveryFormat[] = [
  {
    id: 1,
    format_code: 'BULK',
    format_name: 'Bulk Cargo',
    description: 'Loose cargo shipped in bulk without packaging',
    transport_mode: 'Ship',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    format_code: 'CONT',
    format_name: 'Container',
    description: 'Goods shipped in standardized containers',
    transport_mode: 'Ship/Truck/Rail',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 3,
    format_code: 'TANK',
    format_name: 'Tank Transport',
    description: 'Liquid commodities in tank containers or trucks',
    transport_mode: 'Truck/Rail',
    is_active: true,
    created_at: '2024-01-01'
  },
  {
    id: 4,
    format_code: 'BAG',
    format_name: 'Bagged',
    description: 'Commodities packaged in bags or sacks',
    transport_mode: 'Truck/Ship',
    is_active: true,
    created_at: '2024-01-01'
  }
]

export default function DeliveryFormatsPage() {
  const [formats, setFormats] = useState<DeliveryFormat[]>(mockDeliveryFormats)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<DeliveryFormat | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    format_code: '',
    format_name: '',
    description: '',
    transport_mode: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFormat) {
        const updated = { ...editingFormat, ...formData }
        setFormats(formats.map(f => f.id === editingFormat.id ? updated : f))
        toast({ title: 'Success', description: 'Delivery format updated successfully' })
      } else {
        const newFormat: DeliveryFormat = {
          ...formData,
          id: Math.max(...formats.map(f => f.id)) + 1,
          created_at: new Date().toISOString().split('T')[0]
        }
        setFormats([...formats, newFormat])
        toast({ title: 'Success', description: 'Delivery format created successfully' })
      }
      setDialogOpen(false)
      setEditingFormat(null)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save delivery format', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      format_code: '',
      format_name: '',
      description: '',
      transport_mode: '',
      is_active: true
    })
  }

  const filteredFormats = formats.filter(format =>
    format.format_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format.format_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                <Label>Format Code *</Label>
                <Input
                  value={formData.format_code}
                  onChange={(e) => setFormData({ ...formData, format_code: e.target.value.toUpperCase() })}
                  required
                  placeholder="BULK"
                />
              </div>
              
              <div>
                <Label>Format Name *</Label>
                <Input
                  value={formData.format_name}
                  onChange={(e) => setFormData({ ...formData, format_name: e.target.value })}
                  required
                  placeholder="Bulk Cargo"
                />
              </div>

              <div>
                <Label>Transport Mode</Label>
                <Input
                  value={formData.transport_mode}
                  onChange={(e) => setFormData({ ...formData, transport_mode: e.target.value })}
                  placeholder="Ship/Truck/Rail"
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Transport Mode</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFormats.map((format) => (
                <TableRow key={format.id}>
                  <TableCell className="font-medium">{format.format_code}</TableCell>
                  <TableCell>{format.format_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{format.transport_mode}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {format.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={format.is_active ? "default" : "secondary"}>
                      {format.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingFormat(format)
                        setFormData({
                          format_code: format.format_code,
                          format_name: format.format_name,
                          description: format.description,
                          transport_mode: format.transport_mode,
                          is_active: format.is_active
                        })
                        setDialogOpen(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setFormats(formats.filter(f => f.id !== format.id))
                        toast({ title: 'Success', description: 'Delivery format deleted successfully' })
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