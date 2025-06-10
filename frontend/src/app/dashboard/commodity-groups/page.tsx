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
import { Plus, Search, Edit, Trash2, Layers, Package2, TrendingUp, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CommodityGroup {
  id: number
  group_code: string
  group_name: string
  description: string
  is_active: boolean
  commodity_count: number
  created_at: string
}

// Mock data - replace with API calls
const mockCommodityGroups: CommodityGroup[] = [
  {
    id: 1,
    group_code: 'METALS',
    group_name: 'Metals',
    description: 'Precious and base metals including gold, silver, copper, and aluminum',
    is_active: true,
    commodity_count: 12,
    created_at: '2024-01-01'
  },
  {
    id: 2,
    group_code: 'ENERGY',
    group_name: 'Energy',
    description: 'Oil, gas, coal, and renewable energy commodities',
    is_active: true,
    commodity_count: 8,
    created_at: '2024-01-01'
  },
  {
    id: 3,
    group_code: 'AGRI',
    group_name: 'Agriculture',
    description: 'Grains, livestock, dairy, and other agricultural products',
    is_active: true,
    commodity_count: 25,
    created_at: '2024-01-01'
  },
  {
    id: 4,
    group_code: 'SOFT',
    group_name: 'Soft Commodities',
    description: 'Coffee, cocoa, sugar, cotton, and other soft commodities',
    is_active: true,
    commodity_count: 10,
    created_at: '2024-01-01'
  },
  {
    id: 5,
    group_code: 'CHEM',
    group_name: 'Chemicals',
    description: 'Industrial chemicals, fertilizers, and chemical products',
    is_active: true,
    commodity_count: 15,
    created_at: '2024-01-01'
  },
  {
    id: 6,
    group_code: 'RARE',
    group_name: 'Rare Earth Elements',
    description: 'Rare earth metals and elements used in technology',
    is_active: false,
    commodity_count: 3,
    created_at: '2024-01-01'
  }
]

export default function CommodityGroupsPage() {
  const [commodityGroups, setCommodityGroups] = useState<CommodityGroup[]>(mockCommodityGroups)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CommodityGroup | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    group_code: '',
    group_name: '',
    description: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingGroup) {
        // Update existing group
        const updatedGroup = {
          ...editingGroup,
          ...formData,
          id: editingGroup.id,
          created_at: editingGroup.created_at,
          commodity_count: editingGroup.commodity_count
        }
        setCommodityGroups(commodityGroups.map(g => g.id === editingGroup.id ? updatedGroup : g))
        toast({
          title: 'Success',
          description: 'Commodity group updated successfully'
        })
      } else {
        // Create new group
        const newGroup: CommodityGroup = {
          ...formData,
          id: Math.max(...commodityGroups.map(g => g.id)) + 1,
          commodity_count: 0,
          created_at: new Date().toISOString().split('T')[0]
        }
        setCommodityGroups([...commodityGroups, newGroup])
        toast({
          title: 'Success',
          description: 'Commodity group created successfully'
        })
      }
      setDialogOpen(false)
      setEditingGroup(null)
      resetForm()
    } catch (error) {
      console.error('Error saving commodity group:', error)
      toast({
        title: 'Error',
        description: 'Failed to save commodity group',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (group: CommodityGroup) => {
    setEditingGroup(group)
    setFormData({
      group_code: group.group_code,
      group_name: group.group_name,
      description: group.description,
      is_active: group.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this commodity group?')) return
    
    try {
      setCommodityGroups(commodityGroups.filter(g => g.id !== id))
      toast({
        title: 'Success',
        description: 'Commodity group deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting commodity group:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete commodity group',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      group_code: '',
      group_name: '',
      description: '',
      is_active: true
    })
  }

  const filteredGroups = commodityGroups.filter(group =>
    group.group_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeGroups = commodityGroups.filter(g => g.is_active).length
  const totalCommodities = commodityGroups.reduce((sum, g) => sum + g.commodity_count, 0)

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8 text-primary" />
            Commodity Groups
          </h1>
          <p className="text-gray-600 mt-2">Manage commodity categories and classifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingGroup(null) }} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {editingGroup ? 'Edit Commodity Group' : 'Create New Commodity Group'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {editingGroup ? 'update' : 'create'} a commodity group.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="group_code">Group Code *</Label>
                <Input
                  id="group_code"
                  value={formData.group_code}
                  onChange={(e) => setFormData({ ...formData, group_code: e.target.value.toUpperCase() })}
                  required
                  placeholder="METALS"
                />
              </div>
              
              <div>
                <Label htmlFor="group_name">Group Name *</Label>
                <Input
                  id="group_name"
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  required
                  placeholder="Metals"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the commodity group..."
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
                <Label htmlFor="is_active">Active Group</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {editingGroup ? 'Update Group' : 'Create Group'}
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
              <Layers className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                <p className="text-2xl font-bold">{commodityGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Groups</p>
                <p className="text-2xl font-bold">{activeGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package2 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commodities</p>
                <p className="text-2xl font-bold">{totalCommodities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg per Group</p>
                <p className="text-2xl font-bold">
                  {commodityGroups.length > 0 ? Math.round(totalCommodities / commodityGroups.length) : 0}
                </p>
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
              placeholder="Search commodity groups..."
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
            <span>Commodity Groups ({filteredGroups.length})</span>
          </CardTitle>
          <CardDescription>
            Organize commodities into logical groups and categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Commodities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Layers className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium">{group.group_code}</div>
                        <div className="text-sm text-muted-foreground">{group.group_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {group.description || 'No description provided'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Package2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{group.commodity_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={group.is_active ? "default" : "secondary"}>
                      {group.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(group.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(group.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredGroups.length === 0 && (
            <div className="text-center py-8">
              <Layers className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No commodity groups found</p>
              <p className="text-sm text-gray-400">Try adjusting your search</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}