'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CheckCircle2, AlertCircle, Info, XCircle, CheckCheck, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  read: boolean
}

// Static notifications data for dealer
const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Order Approved',
    message: 'Order #ORD-2024-089 has been approved by admin',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'New Estimate Request',
    message: 'A new estimate request has been submitted',
    time: '3 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Payment Pending',
    message: 'Payment for Invoice #INV-2024-050 is pending',
    time: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Commission Credited',
    message: 'Commission of $450.00 has been credited to your account',
    time: '2 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'Product Catalog Updated',
    message: 'New products have been added to the catalog',
    time: '3 days ago',
    read: true,
  },
  {
    id: '6',
    type: 'info',
    title: 'Training Session Scheduled',
    message: 'A new training session is scheduled for Feb 5, 2025',
    time: '4 days ago',
    read: false,
  },
  {
    id: '7',
    type: 'success',
    title: 'Referral Bonus',
    message: 'You earned a referral bonus for customer #CUST-2024-123',
    time: '5 days ago',
    read: true,
  },
  {
    id: '8',
    type: 'warning',
    title: 'Account Review',
    message: 'Your dealer account is due for quarterly review',
    time: '1 week ago',
    read: true,
  },
]

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
    case 'warning':
      return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
    case 'error':
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
    default:
      return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  }
}

export default function DealerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All notifications read'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark All as Read
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setClearConfirmOpen(true)}
                className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
              <Info className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50",
                !notification.read && "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium text-gray-900 dark:text-white",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Clear all notifications"
        description="Are you sure you want to clear all notifications? This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleClearAll}
      />
    </div>
  )
}
