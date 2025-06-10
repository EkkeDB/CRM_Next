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
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Sociedad {
  id: number
  sociedad_code: string
  sociedad_name: string
  legal_name: string
  tax_id: string
  country: string
  is_active: boolean
  description: string
  created_at: string
}

const mockSociedades: Sociedad[] = [
  {
    id: 1,
    sociedad_code: 'MAIN',
    sociedad_name: 'Main Trading Entity',
    legal_name: 'NextCRM Trading Corp',
    tax_id: 'TC123456789',
    country: 'USA',
    is_active: true,
    description: 'Primary trading entity for commodity operations',
    created_at: '2024-01-01'
  },
  {
    id: 2,
    sociedad_code: 'EUR',
    sociedad_name: 'European Subsidiary',
    legal_name: 'NextCRM Europe Ltd',
    tax_id: 'EU987654321',
    country: 'Netherlands',
    is_active: true,
    description: 'European operations and trading entity',
    created_at: '2024-01-01'
  },
  {
    id: 3,
    sociedad_code: 'ASIA',
    sociedad_name: 'Asian Operations',
    legal_name: 'NextCRM Asia Pte Ltd',
    tax_id: 'AS555666777',
    country: 'Singapore',
    is_active: true,
    description: 'Asian market operations and trading',
    created_at: '2024-01-01'
  }
]

export default function SociedadesPage() {
  const [sociedades, setSociedades] = useState<Sociedad[]>(mockSociedades)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSociedad, setEditingSociedad] = useState<Sociedad | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    sociedad_code: '',
    sociedad_name: '',
    legal_name: '',
    tax_id: '',
    country: '',
    description: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSociedad) {
        const updated = {
          ...editingSociedad,
          ...formData,
          id: editingSociedad.id,
          created_at: editingSociedad.created_at
        }
        setSociedades(sociedades.map(s => s.id === editingSociedad.id ? updated : s))
        toast({ title: 'Success', description: 'Sociedad updated successfully' })
      } else {
        const newSociedad: Sociedad = {
          ...formData,
          id: Math.max(...sociedades.map(s => s.id)) + 1,
          created_at: new Date().toISOString().split('T')[0]
        }
        setSociedades([...sociedades, newSociedad])
        toast({ title: 'Success', description: 'Sociedad created successfully' })
      }
      setDialogOpen(false)
      setEditingSociedad(null)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save sociedad', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      sociedad_code: '',
      sociedad_name: '',
      legal_name: '',
      tax_id: '',
      country: '',
      description: '',
      is_active: true
    })
  }

  const filteredSociedades = sociedades.filter(sociedad =>
    sociedad.sociedad_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sociedad.sociedad_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sociedad.legal_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sociedad Code *</Label>
                  <Input
                    value={formData.sociedad_code}
                    onChange={(e) => setFormData({ ...formData, sociedad_code: e.target.value.toUpperCase() })}
                    required
                    placeholder="MAIN"
                  />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                    placeholder="USA"
                  />
                </div>
              </div>
              
              <div>
                <Label>Sociedad Name *</Label>
                <Input
                  value={formData.sociedad_name}
                  onChange={(e) => setFormData({ ...formData, sociedad_name: e.target.value })}
                  required
                  placeholder="Main Trading Entity"
                />
              </div>

              <div>
                <Label>Legal Name *</Label>
                <Input
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  required
                  placeholder="NextCRM Trading Corp"
                />
              </div>

              <div>
                <Label>Tax ID</Label>
                <Input
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="TC123456789"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the legal entity..."
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
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                  {editingSociedad ? 'Update' : 'Create'}
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
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Legal Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSociedades.map((sociedad) => (
                <TableRow key={sociedad.id}>
                  <TableCell className="font-medium">{sociedad.sociedad_code}</TableCell>
                  <TableCell>{sociedad.sociedad_name}</TableCell>
                  <TableCell>{sociedad.legal_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sociedad.country}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{sociedad.tax_id || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={sociedad.is_active ? "default" : "secondary"}>
                      {sociedad.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingSociedad(sociedad)
                        setFormData({
                          sociedad_code: sociedad.sociedad_code,
                          sociedad_name: sociedad.sociedad_name,
                          legal_name: sociedad.legal_name,
                          tax_id: sociedad.tax_id,
                          country: sociedad.country,
                          description: sociedad.description,
                          is_active: sociedad.is_active
                        })
                        setDialogOpen(true)
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSociedades(sociedades.filter(s => s.id !== sociedad.id))
                        toast({ title: 'Success', description: 'Sociedad deleted successfully' })
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