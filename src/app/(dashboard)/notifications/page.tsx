'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NotificationType = 'SYSTEM' | 'QUOTE' | 'ORDER' | 'TASK' | 'PAYMENT' | 'OTHER'
type NotificationStatus = 'UNREAD' | 'READ'

interface Notification {
  id: string
  text: string
  type: NotificationType
  status: NotificationStatus
  time: string
  color: string
  relatedTo?: string
  relatedToId?: string
}

const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    text: 'You fixed a bug.',
    type: 'SYSTEM',
    status: 'UNREAD',
    time: 'Just now',
    color: 'bg-blue-500',
  },
  {
    id: 'notif_2',
    text: 'New user registered.',
    type: 'SYSTEM',
    status: 'READ',
    time: '59 minutes ago',
    color: 'bg-gray-400',
  },
  {
    id: 'notif_3',
    text: 'Quote #QT-2024-1234 has been approved by customer.',
    type: 'QUOTE',
    status: 'UNREAD',
    time: '2 hours ago',
    color: 'bg-green-500',
    relatedTo: 'Quote',
    relatedToId: 'QT-2024-1234',
  },
  {
    id: 'notif_4',
    text: 'Andi Lane subscribed to you.',
    type: 'SYSTEM',
    status: 'READ',
    time: 'Today, 11:59 AM',
    color: 'bg-gray-400',
  },
  {
    id: 'notif_5',
    text: 'Order #ORD-001 is ready for installation.',
    type: 'ORDER',
    status: 'UNREAD',
    time: '3 hours ago',
    color: 'bg-orange-500',
    relatedTo: 'Order',
    relatedToId: 'ORD-001',
  },
  {
    id: 'notif_6',
    text: 'Payment received for Invoice #INV-2024-5678.',
    type: 'PAYMENT',
    status: 'READ',
    time: 'Yesterday, 3:45 PM',
    color: 'bg-green-500',
    relatedTo: 'Invoice',
    relatedToId: 'INV-2024-5678',
  },
  {
    id: 'notif_7',
    text: 'Task "Follow up with James Smith" is due today.',
    type: 'TASK',
    status: 'UNREAD',
    time: 'Yesterday, 2:30 PM',
    color: 'bg-red-500',
    relatedTo: 'Task',
    relatedToId: 'task_1',
  },
  {
    id: 'notif_8',
    text: 'New ticket #TKT-001 has been assigned to you.',
    type: 'OTHER',
    status: 'READ',
    time: '2 days ago',
    color: 'bg-blue-500',
    relatedTo: 'Ticket',
    relatedToId: 'TKT-001',
  },
  {
    id: 'notif_9',
    text: 'Quote #QT-2024-5678 has expired.',
    type: 'QUOTE',
    status: 'UNREAD',
    time: '2 days ago',
    color: 'bg-yellow-500',
    relatedTo: 'Quote',
    relatedToId: 'QT-2024-5678',
  },
  {
    id: 'notif_10',
    text: 'Production order #ORD-002 has been completed.',
    type: 'ORDER',
    status: 'READ',
    time: '3 days ago',
    color: 'bg-green-500',
    relatedTo: 'Order',
    relatedToId: 'ORD-002',
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, status: 'READ' as NotificationStatus } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, status: 'READ' as NotificationStatus }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const getTypeLabel = (type: NotificationType) => {
    const labels: Record<NotificationType, string> = {
      SYSTEM: 'System',
      QUOTE: 'Quote',
      ORDER: 'Order',
      TASK: 'Task',
      PAYMENT: 'Payment',
      OTHER: 'Other',
    }
    return labels[type]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and view all your notifications
          </p>
        </div>
        <Button onClick={markAllAsRead} variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Notification</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Type</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Time</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No notifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notif) => (
                    <TableRow
                      key={notif.id}
                      className={cn(
                        'hover:bg-gray-50 dark:hover:bg-gray-800',
                        notif.status === 'UNREAD' && 'bg-blue-50/50 dark:bg-blue-900/10'
                      )}
                    >
                      <TableCell>
                        <span className={`inline-block h-2 w-2 rounded-full ${notif.color}`} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notif.text}
                          </p>
                          {notif.relatedTo && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Related to: {notif.relatedTo} {notif.relatedToId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                        >
                          {getTypeLabel(notif.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {notif.time}
                      </TableCell>
                      <TableCell>
                        {notif.status === 'UNREAD' ? (
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                            Unread
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                          >
                            Read
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {notif.status === 'UNREAD' && (
                              <DropdownMenuItem onClick={() => markAsRead(notif.id)}>
                                Mark as read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteNotification(notif.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

