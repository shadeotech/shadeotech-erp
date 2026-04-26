'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Calendar, CheckSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface Task {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  dueDate?: Date
  assignedTo?: string
  assignedToNames?: string[]
}

const priorityStyles = {
  LOW: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  MEDIUM: 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  HIGH: 'bg-orange-500/10 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  URGENT: 'bg-red-500/10 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

interface TasksTabProps {
  customerId: string
}

export function TasksTab({ customerId }: TasksTabProps) {
  const { token } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newTask, setNewTask] = useState('')

  const fetchTasks = useCallback(async () => {
    if (!token || !customerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks?customerId=${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTasks((data.tasks || []).map((t: any) => ({
          id: t.id || t._id,
          title: t.title,
          priority: (t.priority || 'MEDIUM') as Task['priority'],
          status: (t.status || 'TODO') as Task['status'],
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          assignedTo: t.assignedTo?.[0],
          assignedToNames: t.assignedToNames,
        })))
      } else {
        setTasks([])
      }
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [token, customerId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
        }
      }
      return task
    }))
  }

  const handleAddTask = () => {
    if (!newTask.trim()) return
    setNewTask('')
    setIsAdding(false)
    fetchTasks()
  }

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Tasks ({pendingTasks.length} pending)</h3>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Add Task */}
      {isAdding && (
        <div className="flex gap-2 rounded-lg border p-3">
          <Input
            placeholder="Task title..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1"
          />
          <Select defaultValue="MEDIUM">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddTask}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={task.status === 'COMPLETED'}
                onCheckedChange={() => toggleTaskStatus(task.id)}
              />
              <div className="flex-1">
                <p className="font-medium">{task.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {task.dueDate.toLocaleDateString()}
                    </span>
                  )}
                  {(task.assignedToNames?.length ? task.assignedToNames[0] : task.assignedTo) && (
                    <span>• {task.assignedToNames?.[0] || task.assignedTo}</span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={cn('border-0', priorityStyles[task.priority])}>
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Completed ({completedTasks.length})</p>
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border p-3 opacity-60"
            >
              <Checkbox
                checked={true}
                onCheckedChange={() => toggleTaskStatus(task.id)}
              />
              <span className="line-through">{task.title}</span>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="py-8 text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No tasks yet</p>
        </div>
      )}
    </div>
  )
}

