'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Additive {
  id: number
  additive_code: string
  additive_name: string
  description: string
  is_active: boolean
}

const mockAdditives: Additive[] = [
  { id: 1, additive_code: 'NONE', additive_name: 'No Additive', description: 'Pure commodity without additives', is_active: true },
  { id: 2, additive_code: 'ANTI', additive_name: 'Anti-corrosive', description: 'Prevents corrosion during transport', is_active: true },
  { id: 3, additive_code: 'STAB', additive_name: 'Stabilizer', description: 'Chemical stabilizer for preservation', is_active: true }
]

export default function AdditivesPage() {
  const [additives, setAdditives] = useState<Additive[]>(mockAdditives)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAdditive, setEditingAdditive] = useState<Additive | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    additive_code: '',
    additive_name: '',
    description: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAdditive) {
        const updated = { ...editingAdditive, ...formData }
        setAdditives(additives.map(a => a.id === editingAdditive.id ? updated : a))
        toast({ title: 'Success', description: 'Additive updated successfully' })
      } else {
        const newAdditive: Additive = {
          ...formData,
          id: Math.max(...additives.map(a => a.id)) + 1
        }
        setAdditives([...additives, newAdditive])
        toast({ title: 'Success', description: 'Additive created successfully' })
      }
      setDialogOpen(false)
      setEditingAdditive(null)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save additive', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({ additive_code: '', additive_name: '', description: '', is_active: true })
  }

  const filteredAdditives = additives.filter(additive =>
    additive.additive_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    additive.additive_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plus className="h-8 w-8 text-primary" />
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAdditive ? 'Edit' : 'Create'} Additive</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={formData.additive_code}
                  onChange={(e) => setFormData({ ...formData, additive_code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.additive_name}
                  onChange={(e) => setFormData({ ...formData, additive_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingAdditive ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <Input
            placeholder="Search additives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Additives ({filteredAdditives.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdditives.map((additive) => (
                <TableRow key={additive.id}>
                  <TableCell className="font-medium">{additive.additive_code}</TableCell>
                  <TableCell>{additive.additive_name}</TableCell>
                  <TableCell>{additive.description}</TableCell>
                  <TableCell>
                    <Badge variant={additive.is_active ? "default" : "secondary"}>
                      {additive.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingAdditive(additive)
                        setFormData(additive)
                        setDialogOpen(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setAdditives(additives.filter(a => a.id !== additive.id))
                        toast({ title: 'Success', description: 'Additive deleted successfully' })
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