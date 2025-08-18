'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Shield, UserCheck, UserX, Users, User, Clock, CheckCircle, XCircle, Eye, Activity, Trash2, Crown, UserCog } from 'lucide-react'
import { usersApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { User } from '@/types'

interface ActionDialogState {
  open: boolean
  user: User | null
  action: 'approve' | 'reject' | 'delete' | 'toggleAdmin' | 'toggleTrader' | null
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    user: null,
    action: null
  })
  const [submitting, setSubmitting] = useState(false)
  
  const { user: currentUser, isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Access control - redirect if not superuser
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !currentUser?.is_superuser)) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive'
      })
      router.push('/dashboard')
    }
  }, [isAuthenticated, currentUser, isLoading, router, toast])

  useEffect(() => {
    if (isAuthenticated && currentUser?.is_superuser) {
      fetchUsers()
    }
  }, [isAuthenticated, currentUser])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAll()
      setUsers(response.results || response)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (user: User) => {
    setActionDialog({
      open: true,
      user,
      action: 'approve'
    })
  }

  const handleRejectClick = (user: User) => {
    setActionDialog({
      open: true,
      user,
      action: 'reject'
    })
  }

  const handleDeleteClick = (user: User) => {
    setActionDialog({
      open: true,
      user,
      action: 'delete'
    })
  }

  const handleToggleAdminClick = (user: User) => {
    setActionDialog({
      open: true,
      user,
      action: 'toggleAdmin'
    })
  }

  const handleToggleTraderClick = (user: User) => {
    setActionDialog({
      open: true,
      user,
      action: 'toggleTrader'
    })
  }

  const handleActionConfirm = async () => {
    if (!actionDialog.user || !actionDialog.action) return

    try {
      setSubmitting(true)
      
      let message = ''
      
      switch (actionDialog.action) {
        case 'approve':
          await usersApi.approve(actionDialog.user.id)
          message = `User "${actionDialog.user.username}" has been approved`
          break
        case 'reject':
          await usersApi.reject(actionDialog.user.id)
          message = `User "${actionDialog.user.username}" has been rejected`
          break
        case 'delete':
          await usersApi.delete(actionDialog.user.id)
          message = `User "${actionDialog.user.username}" has been deleted`
          break
        case 'toggleAdmin':
          await usersApi.toggleAdmin(actionDialog.user.id)
          const adminAction = actionDialog.user.is_superuser ? 'removed admin privileges from' : 'granted admin privileges to'
          message = `Successfully ${adminAction} user "${actionDialog.user.username}"`
          break
        case 'toggleTrader':
          await usersApi.toggleTrader(actionDialog.user.id)
          const traderAction = actionDialog.user.profile?.is_trader ? 'removed trader status from' : 'granted trader status to'
          message = `Successfully ${traderAction} user "${actionDialog.user.username}"`
          break
        default:
          return
      }

      toast({
        title: 'Success',
        description: message,
        variant: 'default'
      })

      // Refresh users list
      await fetchUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || `Failed to ${actionDialog.action} user`,
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
      setActionDialog({ open: false, user: null, action: null })
    }
  }

  const handleActionCancel = () => {
    setActionDialog({ open: false, user: null, action: null })
  }

  const getApprovalStatus = (user: User) => {
    if (user.profile?.is_approved === true) {
      return { status: 'approved', label: 'Approved', variant: 'default' as const }
    } else if (user.profile?.is_approved === false) {
      return { status: 'rejected', label: 'Rejected', variant: 'destructive' as const }
    } else {
      return { status: 'pending', label: 'Pending', variant: 'secondary' as const }
    }
  }

  const getTraderStatus = (user: User) => {
    return user.profile?.is_trader 
      ? { status: 'trader', label: 'Trader', variant: 'default' as const }
      : { status: 'not_trader', label: 'Not Trader', variant: 'outline' as const }
  }

  const getAdminStatus = (user: User) => {
    return user.is_superuser 
      ? { status: 'admin', label: 'Admin', variant: 'default' as const }
      : { status: 'user', label: 'User', variant: 'outline' as const }
  }

  const getActiveStatus = (user: User) => {
    return user.is_active 
      ? { status: 'active', label: 'Active', variant: 'default' as const }
      : { status: 'inactive', label: 'Inactive', variant: 'secondary' as const }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile?.company && user.profile.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'pending' && user.profile?.is_approved === null) ||
      (filterStatus === 'approved' && user.profile?.is_approved === true) ||
      (filterStatus === 'rejected' && user.profile?.is_approved === false) ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)

    return matchesSearch && matchesFilter
  })

  const getStats = () => {
    const totalUsers = users.length
    const pendingUsers = users.filter(u => u.profile?.is_approved === null).length
    const approvedUsers = users.filter(u => u.profile?.is_approved === true).length
    const rejectedUsers = users.filter(u => u.profile?.is_approved === false).length
    const activeUsers = users.filter(u => u.is_active).length

    return { totalUsers, pendingUsers, approvedUsers, rejectedUsers, activeUsers }
  }

  // Show loading or redirect for unauthorized users
  if (isLoading || !isAuthenticated || !currentUser?.is_superuser) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-gray-600 mt-2">Manage user registrations and approvals</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approvedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejectedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, username, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({filteredUsers.length})</span>
          </CardTitle>
          <CardDescription>
            Manage user registrations, approvals, and account status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Trader Status</TableHead>
                <TableHead>Admin Status</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const approvalStatus = getApprovalStatus(user)
                const traderStatus = getTraderStatus(user)
                const adminStatus = getAdminStatus(user)
                const activeStatus = getActiveStatus(user)

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.email}</div>
                        {user.profile?.phone && (
                          <div className="text-muted-foreground">{user.profile.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={approvalStatus.variant}>
                        {approvalStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={traderStatus.variant}>
                        {traderStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={adminStatus.variant}>
                        {adminStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={activeStatus.variant}>
                        {activeStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(user.date_joined)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(user.last_login)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Approval Actions */}
                        {user.profile?.is_approved === null && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveClick(user)}
                              disabled={submitting}
                              className="text-green-600 hover:text-green-700"
                              title="Approve User"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectClick(user)}
                              disabled={submitting}
                              className="text-red-600 hover:text-red-700"
                              title="Reject User"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {user.profile?.is_approved === false && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveClick(user)}
                            disabled={submitting}
                            className="text-green-600 hover:text-green-700"
                            title="Approve User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {user.profile?.is_approved === true && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectClick(user)}
                            disabled={submitting}
                            className="text-red-600 hover:text-red-700"
                            title="Reject User"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Admin Toggle */}
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdminClick(user)}
                            disabled={submitting}
                            className={user.is_superuser ? "text-purple-600 hover:text-purple-700" : "text-blue-600 hover:text-blue-700"}
                            title={user.is_superuser ? "Remove Admin Privileges" : "Grant Admin Privileges"}
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Trader Toggle */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTraderClick(user)}
                          disabled={submitting}
                          className={user.profile?.is_trader ? "text-indigo-600 hover:text-indigo-700" : "text-gray-600 hover:text-gray-700"}
                          title={user.profile?.is_trader ? "Remove Trader Status" : "Grant Trader Status"}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        
                        {/* Delete */}
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            disabled={submitting}
                            className="text-red-600 hover:text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-2">No users found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && handleActionCancel()}
        title={
          actionDialog.action === 'approve' ? 'Approve User' :
          actionDialog.action === 'reject' ? 'Reject User' :
          actionDialog.action === 'delete' ? 'Delete User' :
          actionDialog.action === 'toggleAdmin' ? 'Toggle Admin Privileges' :
          actionDialog.action === 'toggleTrader' ? 'Toggle Trader Status' :
          'Confirm Action'
        }
        description={
          actionDialog.user && actionDialog.action
            ? (() => {
                switch (actionDialog.action) {
                  case 'approve':
                    return `Are you sure you want to approve "${actionDialog.user.username}"? This will allow them to access the system.`
                  case 'reject':
                    return `Are you sure you want to reject "${actionDialog.user.username}"? This will prevent them from accessing the system and deactivate their account.`
                  case 'delete':
                    return `Are you sure you want to permanently delete "${actionDialog.user.username}"? This action cannot be undone and will remove all user data.`
                  case 'toggleAdmin':
                    return actionDialog.user.is_superuser 
                      ? `Are you sure you want to remove admin privileges from "${actionDialog.user.username}"?`
                      : `Are you sure you want to grant admin privileges to "${actionDialog.user.username}"? This will give them full access to the admin panel.`
                  case 'toggleTrader':
                    return actionDialog.user.profile?.is_trader
                      ? `Are you sure you want to remove trader status from "${actionDialog.user.username}"? They will no longer appear in the traders list.`
                      : `Are you sure you want to grant trader status to "${actionDialog.user.username}"? They will appear in the traders list.`
                  default:
                    return ''
                }
              })()
            : ''
        }
        confirmText={
          actionDialog.action === 'approve' ? 'Approve' :
          actionDialog.action === 'reject' ? 'Reject' :
          actionDialog.action === 'delete' ? 'Delete' :
          actionDialog.action === 'toggleAdmin' ? (actionDialog.user?.is_superuser ? 'Remove Admin' : 'Grant Admin') :
          actionDialog.action === 'toggleTrader' ? (actionDialog.user?.profile?.is_trader ? 'Remove Trader' : 'Grant Trader') :
          'Confirm'
        }
        cancelText="Cancel"
        variant={
          actionDialog.action === 'approve' ? 'default' :
          actionDialog.action === 'reject' || actionDialog.action === 'delete' ? 'destructive' :
          'default'
        }
        onConfirm={handleActionConfirm}
        onCancel={handleActionCancel}
        disabled={submitting}
      />
    </div>
  )
}