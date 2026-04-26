'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, Calendar, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns'

interface Task {
  id: string
  _id: string
  title: string
  dueDate: Date | string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  customerName?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

const priorityStyles = {
  LOW: 'secondary',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'destructive',
} as const

function formatDueDate(date: Date | string): string {
  const dueDate = typeof date === 'string' ? new Date(date) : date
  if (isToday(dueDate)) return 'Today'
  if (isTomorrow(dueDate)) return 'Tomorrow'
  const daysDiff = differenceInDays(dueDate, new Date())
  if (daysDiff < 7 && daysDiff > 0) return format(dueDate, 'EEE, MMM d')
  return format(dueDate, 'MMM d')
}

export function UpcomingTasks() {
  const { token, user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!token || !user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      // Fetch only incomplete tasks assigned to current user
      const params = new URLSearchParams()
      params.append('myTasks', 'true')
      
      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error('Failed to load tasks')
      }
      const data = await res.json()
      // Get upcoming tasks (due in next 7 days or overdue)
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const upcomingTasks = (data.tasks || [])
        .filter((task: any) => {
          if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false
          const dueDate = new Date(task.dueDate)
          return dueDate <= sevenDaysFromNow
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.dueDate).getTime()
          const dateB = new Date(b.dueDate).getTime()
          return dateA - dateB
        })
        .slice(0, 5) // Show only top 5
        .map((task: any) => ({
          id: task._id || task.id,
          _id: task._id || task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          customerName: task.customerName,
          status: task.status,
        }))
      
      setTasks(upcomingTasks)
    } catch (e) {
      console.error('Error fetching tasks:', e)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Upcoming Tasks & Appointments</CardTitle>
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="gap-1">
            View All Tasks
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{task.title}</p>
                      <Badge variant={priorityStyles[task.priority]} className="shrink-0">
                        {task.priority}
                      </Badge>
                    </div>
                    {task.customerName && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {task.customerName}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDueDate(task.dueDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {tasks.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No upcoming tasks
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

