'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Edit, Trash2, Globe, Ship, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Icoterm {
  id: number
  icoterm_code: string
  icoterm_name: string
  description: string
  category: 'departure' | 'main_carriage' | 'arrival'
  is_active: boolean
  risk_transfer_point: string
  cost_responsibility: string
  created_at: string
}

const mockIcoterms: Icoterm[] = [
  {
    id: 1,
    icoterm_code: 'EXW',
    icoterm_name: 'Ex Works',
    description: 'The seller makes the goods available at their premises',
    category: 'departure',
    is_active: true,
    risk_transfer_point: 'Seller premises',
    cost_responsibility: 'Buyer bears all costs from pickup',
    created_at: '2024-01-01'
  },
  {
    id: 2,
    icoterm_code: 'FOB',
    icoterm_name: 'Free on Board',
    description: 'Seller delivers goods on board the vessel nominated by buyer',
    category: 'main_carriage',
    is_active: true,
    risk_transfer_point: 'When goods pass ship rail at port of shipment',
    cost_responsibility: 'Seller pays costs until goods are on board',
    created_at: '2024-01-01'
  },
  {
    id: 3,
    icoterm_code: 'CIF',
    icoterm_name: 'Cost, Insurance and Freight',
    description: 'Seller pays costs and freight to bring goods to port of destination',
    category: 'main_carriage',
    is_active: true,
    risk_transfer_point: 'When goods pass ship rail at port of shipment',
    cost_responsibility: 'Seller pays cost, insurance, and freight',
    created_at: '2024-01-01'
  },
  {
    id: 4,
    icoterm_code: 'DDP',
    icoterm_name: 'Delivered Duty Paid',
    description: 'Seller delivers goods cleared for import at named place',
    category: 'arrival',
    is_active: true,
    risk_transfer_point: 'Named place in country of importation',
    cost_responsibility: 'Seller bears all costs including duties',
    created_at: '2024-01-01'
  },
  {
    id: 5,
    icoterm_code: 'DAP',
    icoterm_name: 'Delivered at Place',
    description: 'Seller delivers when goods are placed at disposal of buyer',
    category: 'arrival',
    is_active: true,
    risk_transfer_point: 'Named place of destination',
    cost_responsibility: 'Seller bears costs until place of destination',
    created_at: '2024-01-01'
  }
]

const categoryOptions = [
  { value: 'departure', label: 'Departure' },
  { value: 'main_carriage', label: 'Main Carriage' },
  { value: 'arrival', label: 'Arrival' }
]

export default function IcotermsPage() {
  const [icoterms, setIcoterms] = useState<Icoterm[]>(mockIcoterms)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIcoterm, setEditingIcoterm] = useState<Icoterm | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    icoterm_code: '',
    icoterm_name: '',
    description: '',
    category: 'departure' as Icoterm['category'],
    risk_transfer_point: '',
    cost_responsibility: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingIcoterm) {
        const updated = { ...editingIcoterm, ...formData }
        setIcoterms(icoterms.map(i => i.id === editingIcoterm.id ? updated : i))
        toast({ title: 'Success', description: 'ICOTERM updated successfully' })
      } else {
        const newIcoterm: Icoterm = {
          ...formData,
          id: Math.max(...icoterms.map(i => i.id)) + 1,
          created_at: new Date().toISOString().split('T')[0]
        }
        setIcoterms([...icoterms, newIcoterm])
        toast({ title: 'Success', description: 'ICOTERM created successfully' })
      }
      setDialogOpen(false)
      setEditingIcoterm(null)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save ICOTERM', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      icoterm_code: '',
      icoterm_name: '',
      description: '',
      category: 'departure',
      risk_transfer_point: '',
      cost_responsibility: '',
      is_active: true
    })
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'departure': return 'default'
      case 'main_carriage': return 'secondary'
      case 'arrival': return 'outline'
      default: return 'outline'
    }
  }

  const filteredIcoterms = icoterms.filter(icoterm =>
    icoterm.icoterm_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icoterm.icoterm_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ICOTERM Code *</Label>
                  <Input
                    value={formData.icoterm_code}
                    onChange={(e) => setFormData({ ...formData, icoterm_code: e.target.value.toUpperCase() })}
                    required
                    placeholder="EXW"
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Icoterm['category'] })}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label>ICOTERM Name *</Label>
                <Input
                  value={formData.icoterm_name}
                  onChange={(e) => setFormData({ ...formData, icoterm_name: e.target.value })}
                  required
                  placeholder="Ex Works"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the ICOTERM..."
                />
              </div>

              <div>
                <Label>Risk Transfer Point</Label>
                <Input
                  value={formData.risk_transfer_point}
                  onChange={(e) => setFormData({ ...formData, risk_transfer_point: e.target.value })}
                  placeholder="When risk transfers to buyer..."
                />
              </div>

              <div>
                <Label>Cost Responsibility</Label>
                <Input
                  value={formData.cost_responsibility}
                  onChange={(e) => setFormData({ ...formData, cost_responsibility: e.target.value })}
                  placeholder="Who bears what costs..."
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
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingIcoterm ? 'Update' : 'Create'}
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
                <TableHead>Category</TableHead>
                <TableHead>Risk Transfer</TableHead>
                <TableHead>Cost Responsibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIcoterms.map((icoterm) => (
                <TableRow key={icoterm.id}>
                  <TableCell className="font-medium">{icoterm.icoterm_code}</TableCell>
                  <TableCell>{icoterm.icoterm_name}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(icoterm.category)}>
                      {icoterm.category.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {icoterm.risk_transfer_point || 'Not specified'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {icoterm.cost_responsibility || 'Not specified'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={icoterm.is_active ? "default" : "secondary"}>
                      {icoterm.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingIcoterm(icoterm)
                        setFormData({
                          icoterm_code: icoterm.icoterm_code,
                          icoterm_name: icoterm.icoterm_name,
                          description: icoterm.description,
                          category: icoterm.category,
                          risk_transfer_point: icoterm.risk_transfer_point,
                          cost_responsibility: icoterm.cost_responsibility,
                          is_active: icoterm.is_active
                        })
                        setDialogOpen(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setIcoterms(icoterms.filter(i => i.id !== icoterm.id))
                        toast({ title: 'Success', description: 'ICOTERM deleted successfully' })
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