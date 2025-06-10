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
import { Plus, Search, Edit, Trash2, Briefcase, Building2, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CostCenter {
  id: number
  cost_center_code: string
  cost_center_name: string
  description: string
  is_active: boolean
  budget_allocated: number
  budget_used: number
  manager: string
  department: string
  created_at: string
}

// Mock data - replace with API calls
const mockCostCenters: CostCenter[] = [
  {
    id: 1,
    cost_center_code: 'CC001',
    cost_center_name: 'Trading Operations',
    description: 'Main trading desk operations and associated costs',
    is_active: true,
    budget_allocated: 1000000,
    budget_used: 750000,
    manager: 'John Smith',
    department: 'Trading',
    created_at: '2024-01-01'
  },
  {
    id: 2,
    cost_center_code: 'CC002',
    cost_center_name: 'Risk Management',
    description: 'Risk analysis and management activities',
    is_active: true,
    budget_allocated: 500000,
    budget_used: 320000,
    manager: 'Sarah Johnson',
    department: 'Risk',
    created_at: '2024-01-01'
  },
  {
    id: 3,
    cost_center_code: 'CC003',
    cost_center_name: 'Logistics',
    description: 'Transportation and logistics coordination',
    is_active: true,
    budget_allocated: 800000,
    budget_used: 600000,
    manager: 'Mike Davis',
    department: 'Operations',
    created_at: '2024-01-01'
  },
  {
    id: 4,
    cost_center_code: 'CC004',
    cost_center_name: 'IT Infrastructure',
    description: 'Technology and systems maintenance',
    is_active: true,
    budget_allocated: 300000,
    budget_used: 180000,
    manager: 'Lisa Chen',
    department: 'IT',
    created_at: '2024-01-01'
  },
  {
    id: 5,
    cost_center_code: 'CC005',
    cost_center_name: 'Marketing',
    description: 'Marketing and business development activities',
    is_active: false,
    budget_allocated: 200000,
    budget_used: 150000,
    manager: 'Tom Wilson',
    department: 'Marketing',
    created_at: '2024-01-01'
  }
]

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>(mockCostCenters)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    cost_center_code: '',
    cost_center_name: '',
    description: '',
    is_active: true,
    budget_allocated: 0,
    budget_used: 0,
    manager: '',
    department: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCostCenter) {
        // Update existing cost center
        const updatedCostCenter = {
          ...editingCostCenter,
          ...formData,
          id: editingCostCenter.id,
          created_at: editingCostCenter.created_at
        }
        setCostCenters(costCenters.map(c => c.id === editingCostCenter.id ? updatedCostCenter : c))
        toast({
          title: 'Success',
          description: 'Cost center updated successfully'
        })
      } else {
        // Create new cost center
        const newCostCenter: CostCenter = {
          ...formData,
          id: Math.max(...costCenters.map(c => c.id)) + 1,
          created_at: new Date().toISOString().split('T')[0]
        }
        setCostCenters([...costCenters, newCostCenter])
        toast({
          title: 'Success',
          description: 'Cost center created successfully'
        })
      }
      setDialogOpen(false)
      setEditingCostCenter(null)
      resetForm()
    } catch (error) {
      console.error('Error saving cost center:', error)
      toast({
        title: 'Error',
        description: 'Failed to save cost center',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter)
    setFormData({
      cost_center_code: costCenter.cost_center_code,
      cost_center_name: costCenter.cost_center_name,
      description: costCenter.description,
      is_active: costCenter.is_active,
      budget_allocated: costCenter.budget_allocated,
      budget_used: costCenter.budget_used,
      manager: costCenter.manager,
      department: costCenter.department
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cost center?')) return
    
    try {
      setCostCenters(costCenters.filter(c => c.id !== id))
      toast({
        title: 'Success',
        description: 'Cost center deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting cost center:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete cost center',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      cost_center_code: '',
      cost_center_name: '',
      description: '',
      is_active: true,
      budget_allocated: 0,
      budget_used: 0,
      manager: '',
      department: ''
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getBudgetUtilization = (allocated: number, used: number) => {
    if (allocated === 0) return 0
    return Math.round((used / allocated) * 100)
  }

  const filteredCostCenters = costCenters.filter(center =>
    center.cost_center_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.cost_center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.manager.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCostCenters = costCenters.filter(c => c.is_active).length
  const totalBudget = costCenters.reduce((sum, c) => sum + c.budget_allocated, 0)
  const totalUsed = costCenters.reduce((sum, c) => sum + c.budget_used, 0)

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_center_code">Cost Center Code *</Label>
                  <Input
                    id="cost_center_code"
                    value={formData.cost_center_code}
                    onChange={(e) => setFormData({ ...formData, cost_center_code: e.target.value.toUpperCase() })}
                    required
                    placeholder="CC001"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    placeholder="Trading"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cost_center_name">Cost Center Name *</Label>
                <Input
                  id="cost_center_name"
                  value={formData.cost_center_name}
                  onChange={(e) => setFormData({ ...formData, cost_center_name: e.target.value })}
                  required
                  placeholder="Trading Operations"
                />
              </div>

              <div>
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget_allocated">Budget Allocated</Label>
                  <Input
                    id="budget_allocated"
                    type="number"
                    step="1000"
                    value={formData.budget_allocated}
                    onChange={(e) => setFormData({ ...formData, budget_allocated: parseFloat(e.target.value) || 0 })}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label htmlFor="budget_used">Budget Used</Label>
                  <Input
                    id="budget_used"
                    type="number"
                    step="1000"
                    value={formData.budget_used}
                    onChange={(e) => setFormData({ ...formData, budget_used: parseFloat(e.target.value) || 0 })}
                    placeholder="750000"
                  />
                </div>
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active Cost Center</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingCostCenter ? 'Update Cost Center' : 'Create Cost Center'}
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
                <p className="text-sm font-medium text-muted-foreground">Active Centers</p>
                <p className="text-2xl font-bold">{activeCostCenters}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Utilization</p>
                <p className="text-2xl font-bold">{getBudgetUtilization(totalBudget, totalUsed)}%</p>
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
                <TableHead>Code & Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCostCenters.map((center) => {
                const utilization = getBudgetUtilization(center.budget_allocated, center.budget_used)
                return (
                  <TableRow key={center.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{center.cost_center_code}</div>
                        <div className="text-sm text-muted-foreground">{center.cost_center_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{center.department}</Badge>
                    </TableCell>
                    <TableCell>
                      {center.manager || <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatCurrency(center.budget_allocated)}</div>
                        <div className="text-sm text-muted-foreground">
                          Used: {formatCurrency(center.budget_used)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              utilization > 90 ? 'bg-red-500' : 
                              utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{utilization}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.is_active ? "default" : "secondary"}>
                        {center.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(center)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(center.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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