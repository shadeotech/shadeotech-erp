'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronDown,
  ChevronRight,
  Search,
  Save,
  Shield,
  Users,
  Eye,
  Download,
  Edit,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'

export type AccessLevel = 'no' | 'read' | 'edit' | 'full'

interface PermissionCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

interface UserPermissions {
  userId: string
  permissions: Record<string, AccessLevel>
}

interface StaffUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

const permissionCategories: PermissionCategory[] = [
  { id: 'sales', name: 'Sales', description: 'Access to sales module including quotes, invoices, and payments', icon: <Users className="h-4 w-4" /> },
  { id: 'reports', name: 'Reports', description: 'View and download reports', icon: <Download className="h-4 w-4" /> },
  { id: 'production', name: 'Production', description: 'Access to production orders, schedule, and inventory', icon: <Shield className="h-4 w-4" /> },
  { id: 'contacts', name: 'Contacts', description: 'Access to customer and contact information', icon: <Users className="h-4 w-4" /> },
  { id: 'tasks', name: 'Tasks', description: 'Create, view, and manage tasks', icon: <Edit className="h-4 w-4" /> },
  { id: 'leads', name: 'Leads', description: 'View and manage leads', icon: <Eye className="h-4 w-4" /> },
  { id: 'tickets', name: 'Tickets', description: 'View and manage support tickets', icon: <Shield className="h-4 w-4" /> },
  { id: 'accounting', name: 'Accounting', description: 'Access to accounting and financial data', icon: <Lock className="h-4 w-4" /> },
  { id: 'delivery', name: 'Delivery & Installation', description: 'Access to delivery and installation schedules', icon: <Shield className="h-4 w-4" /> },
  { id: 'calendar', name: 'Calendar', description: 'View and manage calendar events', icon: <Eye className="h-4 w-4" /> },
]

const accessLevels: { value: AccessLevel; label: string; description: string }[] = [
  { value: 'no', label: 'No Access', description: 'Cannot view or access' },
  { value: 'read', label: 'Read Only', description: 'Can view but no action buttons' },
  { value: 'edit', label: 'Edit', description: 'Can view and edit (no delete)' },
  { value: 'full', label: 'Full Access', description: 'Complete access including delete' },
]

export function PermissionsPanel() {
  const { token, user: currentUser, refreshUser } = useAuthStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedUsers, setExpandedUsers] = useState<string[]>([])
  const [users, setUsers] = useState<StaffUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermissions>>({})
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      const fetchedUsers = (data.users || [])
        .filter((u: any) => u.role === 'STAFF')
        .map((u: any) => ({
          id: u.id || u._id,
          name: u.name || `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
        }))
      setUsers(fetchedUsers)
      const initial: Record<string, UserPermissions> = {}
      fetchedUsers.forEach((user: StaffUser) => {
        const userData = (data.users || []).find((u: any) => (u.id || u._id) === user.id)
        const existingPermissions = userData?.permissions || {}
        initial[user.id] = { userId: user.id, permissions: {} }
        permissionCategories.forEach((cat) => {
          if (existingPermissions[cat.id] && ['no', 'read', 'edit', 'full'].includes(existingPermissions[cat.id])) {
            initial[user.id].permissions[cat.id] = existingPermissions[cat.id] as AccessLevel
          } else {
            initial[user.id].permissions[cat.id] = 'no'
          }
        })
      })
      setUserPermissions(initial)
    } catch {
      toast({ title: 'Error', description: 'Failed to load users.', variant: 'destructive' })
    } finally {
      setUsersLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    if (token) fetchUsers()
  }, [token, fetchUsers])

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId])
  }

  const handlePermissionChange = (userId: string, categoryId: string, level: AccessLevel) => {
    setUserPermissions((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], permissions: { ...prev[userId].permissions, [categoryId]: level } },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await Promise.all(
        Object.values(userPermissions).map(async (userPerm) => {
          const permissionsToSave: Record<string, AccessLevel> = {}
          permissionCategories.forEach((cat) => {
            permissionsToSave[cat.id] = userPerm.permissions[cat.id] || 'no'
          })
          const res = await fetch(`/api/users/${userPerm.userId}/permissions`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissions: permissionsToSave }),
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Failed to save permissions')
          }
        })
      )
      if (currentUser && users.some((u) => u.id === currentUser._id)) await refreshUser()
      await fetchUsers()
      toast({ title: 'Success', description: 'Permissions saved successfully!', variant: 'success' as any })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save permissions.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getAccessLevelBadgeColor = (level: AccessLevel) => {
    switch (level) {
      case 'no': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'read': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'edit': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'full': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Grant granular permissions to staff members. Pages without permission will be hidden from the sidebar.
        </p>
        <Button onClick={handleSave} className="gap-2" disabled={saving || usersLoading}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {usersLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users…</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No staff users found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUsers.includes(user.id)
            const permissions = userPermissions[user.id]?.permissions || {}
            return (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleUserExpanded(user.id)}
                      className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                    >
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </button>
                    <Badge
                      variant="outline"
                      className={cn('border-0', user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600')}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-3">
                      {permissionCategories.map((cat) => {
                        const currentLevel = permissions[cat.id] || 'no'
                        return (
                          <div key={cat.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-muted-foreground">{cat.icon}</span>
                                <span className="font-medium text-sm">{cat.name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{cat.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn('border-0 text-xs', getAccessLevelBadgeColor(currentLevel))}>
                                {accessLevels.find((l) => l.value === currentLevel)?.label}
                              </Badge>
                              <Select value={currentLevel} onValueChange={(v) => handlePermissionChange(user.id, cat.id, v as AccessLevel)}>
                                <SelectTrigger className="w-[150px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {accessLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
