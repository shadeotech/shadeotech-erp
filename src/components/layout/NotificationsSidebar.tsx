'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { Bell, ChevronRight, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'

// Static notifications data
const mockNotifications = [
  {
    id: '1',
    type: 'success',
    title: 'Estimate Accepted',
    message: 'Your estimate #QT-2024-001 has been accepted',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'New Invoice',
    message: 'Invoice #INV-2024-045 has been generated',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Payment Reminder',
    message: 'Payment due for Invoice #INV-2024-042',
    time: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Contract Signed',
    message: 'Contract #CT-2024-012 has been signed',
    time: '2 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'Order Status Update',
    message: 'Your order #ORD-2024-078 is in production',
    time: '3 days ago',
    read: true,
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
    default:
      return <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
  }
}

export function NotificationsSidebar() {
  const { rightSidebarCollapsed } = useUIStore()
  const pathname = usePathname()
  
  // Determine notifications route based on current path
  const notificationsPath = pathname?.startsWith('/dealer') 
    ? '/dealer/notifications' 
    : '/portal/notifications'

  return (
    <>
      {/* Mobile backdrop */}
      {!rightSidebarCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => useUIStore.getState().setRightSidebarCollapsed(true)}
        />
      )}
      <aside 
        className={cn(
          "fixed right-0 top-0 z-40 flex h-screen flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out",
          rightSidebarCollapsed 
            ? "w-0 overflow-hidden translate-x-full lg:translate-x-0" 
            : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex h-14 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 transition-opacity duration-300",
          rightSidebarCollapsed && "opacity-0"
        )}>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-900 dark:text-white" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
          </div>
        </div>

        {/* Notifications List */}
        <div className={cn(
          "flex-1 overflow-y-auto px-3 py-4 transition-opacity duration-300",
          rightSidebarCollapsed && "opacity-0 pointer-events-none"
        )}>
          <div className="space-y-3">
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                  notification.read 
                    ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" 
                    : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium text-gray-900 dark:text-white",
                      !notification.read && "font-semibold"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* See More Link */}
        <div className={cn(
          "border-t border-gray-200 dark:border-gray-700 px-3 py-3 transition-opacity duration-300",
          rightSidebarCollapsed && "opacity-0 pointer-events-none"
        )}>
          <Link 
            href={notificationsPath} 
            onClick={() => useUIStore.getState().setRightSidebarCollapsed(true)}
            className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline transition-colors"
          >
            <span>See More</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </>
  )
}
