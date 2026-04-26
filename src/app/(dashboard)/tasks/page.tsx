'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  MoreHorizontal,
  Eye,
  UserPlus,
  X,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface Task {
  id: string
  _id: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string[]
  assignedToNames: string[]
  followUpDate?: Date | string | null
  dueDate: Date | string
  customerId?: string
  customerName?: string
  relatedTo?: string
}

interface User {
  id: string
  _id: string
  name: string
  firstName: string
  lastName: string
  role: string
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-gray-500/10 text-gray-600',
  MEDIUM: 'bg-gray-500/10 text-gray-600',
  HIGH: 'bg-gray-500/10 text-gray-600',
  URGENT: 'bg-gray-500/10 text-gray-600',
}

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-500/10 text-gray-600',
  IN_PROGRESS: 'bg-gray-500/10 text-gray-600',
  COMPLETED: 'bg-gray-500/10 text-gray-600',
  CANCELLED: 'bg-gray-500/10 text-gray-600',
}

export default function TasksPage() {
  const { token, user } = useAuthStore()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [userFilter, setUserFilter] = useState<'all' | string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    assignedTo: '',
    dueDate: '',
  })

  const currentUserId = user?._id || ''

  // Fetch users (ADMIN and STAFF only)
  const fetchUsers = useCallback(async () => {
    if (!token) {
      setUsersLoading(false)
      return
    }
    try {
      setUsersLoading(true)
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error('Failed to load users')
      }
      const data = await res.json()
      // Filter to only ADMIN and STAFF
      const filteredUsers = (data.users || []).filter((u: any) => 
        u.role === 'ADMIN' || u.role === 'STAFF'
      ).map((u: any) => ({
        id: u._id || u.id,
        _id: u._id || u.id,
        name: `${u.firstName} ${u.lastName}`,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
      }))
      setUsers(filteredUsers)
    } catch (e) {
      console.error('Error fetching users:', e)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [token])

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (userFilter !== 'all') params.append('assignedTo', userFilter)

      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load tasks')
      }
      const data = await res.json()
      // Convert date strings to Date objects
      const tasksWithDates = (data.tasks || []).map((task: any) => ({
        ...task,
        id: task._id || task.id,
        followUpDate: task.followUpDate ? new Date(task.followUpDate) : null,
        dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      }))
      setTasks(tasksWithDates)
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to load tasks',
        variant: 'destructive',
      })
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter, priorityFilter, userFilter, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const counters = useMemo(() => {
    const myTasks = tasks.filter(t => {
      const assignedToArray = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo]
      return assignedToArray.includes(currentUserId) && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    })
    const overdue = tasks.filter(t => {
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate
      return (t.status !== 'COMPLETED' && t.status !== 'CANCELLED') && dueDate < new Date()
    })
    const highPriority = tasks.filter(t => 
      (t.priority === 'HIGH' || t.priority === 'URGENT') && 
      t.status !== 'COMPLETED' && 
      t.status !== 'CANCELLED'
    )
    return {
      all: tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
      my: myTasks.length,
      overdue: overdue.length,
      highPriority: highPriority.length,
    }
  }, [tasks, currentUserId])

  const highPriorityDue = useMemo(() => {
    return tasks.filter(t => {
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate
      return (
        (t.priority === 'HIGH' || t.priority === 'URGENT') &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED' &&
        dueDate <= new Date()
      )
    })
  }, [tasks])

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = !search || 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter
      const assignedToArray = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo]
      const matchesUser = userFilter === 'all' || assignedToArray.includes(userFilter)
      return matchesSearch && matchesStatus && matchesPriority && matchesUser
    })
  }, [tasks, search, statusFilter, priorityFilter, userFilter])

  const filteredUsers = useMemo(() => {
    if (!assigneeSearch) return users
    return users.filter(user => 
      user.name.toLowerCase().includes(assigneeSearch.toLowerCase())
    )
  }, [assigneeSearch, users])

  const handleCreateTask = async () => {
    if (!token || !newTask.title || !newTask.dueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || undefined,
          priority: newTask.priority,
          assignedTo: newTask.assignedTo ? [newTask.assignedTo] : undefined,
          dueDate: newTask.dueDate,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create task')
      }

      toast({
        title: 'Success',
        description: 'Task created successfully',
      })
      setNewTask({ title: '', description: '', priority: 'MEDIUM', assignedTo: '', dueDate: '' })
      setDialogOpen(false)
      fetchTasks()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleCompleteTask = async (id: string) => {
    if (!token) return

    try {
      setUpdating(true)
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update task')
      }

      toast({
        title: 'Success',
        description: 'Task marked as completed',
      })
      fetchTasks()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to update task',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleOpenAssignDialog = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTaskId(taskId)
      const assignedToArray = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]
      setSelectedAssignees([...assignedToArray])
      setAssigneeSearch('')
      setAssignDialogOpen(true)
    }
  }

  const handleSaveAssignments = async () => {
    if (!token || !selectedTaskId) return

    try {
      setUpdating(true)
      const res = await fetch(`/api/tasks/${selectedTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignedTo: selectedAssignees }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update task assignments')
      }

      toast({
        title: 'Success',
        description: 'Task assignments updated successfully',
      })
      setAssignDialogOpen(false)
      setSelectedTaskId(null)
      setSelectedAssignees([])
      setAssigneeSearch('')
      fetchTasks()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to update task assignments',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleAssignee = (userId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track all tasks
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Title</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v: any) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To</Label>
                  <Select value={newTask.assignedTo} onValueChange={(v) => setNewTask({ ...newTask, assignedTo: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancel</Button>
              <Button onClick={handleCreateTask} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>


      {/* Counters */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.all}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.my}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.highPriority}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={(v) => setUserFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Follow-up Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Related To</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task) => (
                <TableRow 
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedTask(task)
                    setViewDialogOpen(true)
                  }}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.customerName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.customerName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0', priorityColors[task.priority])}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0', statusColors[task.status])}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(task.assignedToNames) ? (
                        task.assignedToNames.length > 0 ? (
                          task.assignedToNames.map((name, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {task.assignedToNames || 'Unassigned'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.followUpDate
                      ? format(new Date(task.followUpDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {task.relatedTo ? (
                      <Link href={`/quotes/${task.relatedTo}`} className="hover:underline">
                        {task.relatedTo}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTask(task)
                            setViewDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {task.status !== 'COMPLETED' && (
                          <>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCompleteTask(task.id)
                              }} 
                              disabled={updating}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenAssignDialog(task.id)
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign to
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Staff Members</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Selected Staff Members */}
            {selectedAssignees.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Staff ({selectedAssignees.length})</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md border min-h-[60px]">
                  {selectedAssignees.map((userId) => {
                    const user = users.find(u => u.id === userId)
                    if (!user) return null
                    return (
                      <Badge
                        key={userId}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {user.name}
                        <button
                          onClick={() => handleToggleAssignee(userId)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search Staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Staff List */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Staff</Label>
              <div className="border rounded-md max-h-[250px] overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  <div className="divide-y">
                    {usersLoading ? (
                    <div className="px-4 py-8 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {filteredUsers
                        .filter(user => !selectedAssignees.includes(user.id))
                        .map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleToggleAssignee(user.id)}
                            className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                          >
                            <span className="text-sm font-medium">{user.name}</span>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ))}
                      {filteredUsers.filter(user => !selectedAssignees.includes(user.id)).length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          {assigneeSearch ? 'No staff members found' : 'All staff members are already selected'}
                        </div>
                      )}
                    </>
                  )}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No staff members found
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAssignDialogOpen(false)
                setSelectedTaskId(null)
                setSelectedAssignees([])
                setAssigneeSearch('')
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Assignments'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6">
              {/* Task Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={cn('border-0', statusColors[selectedTask.status])}>
                      {selectedTask.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Priority</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={cn('border-0', priorityColors[selectedTask.priority])}>
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Assigned To</Label>
                  <div className="mt-1">
                    {Array.isArray(selectedTask.assignedToNames) && selectedTask.assignedToNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedTask.assignedToNames.map((name, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Due Date</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(selectedTask.dueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                {selectedTask.followUpDate && (
                  <div>
                    <Label className="text-xs text-muted-foreground dark:text-gray-400">Follow-up Date</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(selectedTask.followUpDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                {selectedTask.customerName && (
                  <div>
                    <Label className="text-xs text-muted-foreground dark:text-gray-400">Customer</Label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTask.customerName}
                    </p>
                  </div>
                )}
                {selectedTask.relatedTo && (
                  <div>
                    <Label className="text-xs text-muted-foreground dark:text-gray-400">Related To</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      <Link href={`/quotes/${selectedTask.relatedTo}`} className="hover:underline">
                        {selectedTask.relatedTo}
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Description</Label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
