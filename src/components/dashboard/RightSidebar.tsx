'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Bell, CheckCircle2, AlertCircle, Info, XCircle, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const typeIcon = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
}

export function RightSidebar() {
  const { rightSidebarCollapsed } = useUIStore()
  const { token } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!rightSidebarCollapsed) fetchNotifications()
  }, [rightSidebarCollapsed, token])

  const markAllRead = async () => {
    if (!token) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = async (id: string) => {
    if (!token) return
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const unread = notifications.filter((n) => !n.read).length

  return (
    <>
      {!rightSidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => useUIStore.getState().setRightSidebarCollapsed(true)}
        />
      )}
      <aside
        className={cn(
          "fixed right-0 top-0 z-40 flex h-screen flex-col border-l border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] transition-all duration-300 ease-in-out",
          rightSidebarCollapsed
            ? "w-0 overflow-hidden translate-x-full lg:translate-x-0"
            : "w-72"
        )}
      >
        <div className={cn(
          "flex h-14 items-center justify-between px-4 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0",
          rightSidebarCollapsed && "opacity-0"
        )}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500 dark:text-[#888]" />
            <span className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Notifications</span>
            {unread > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c8864e] text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-[#c8864e] hover:text-[#a86a38] transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>All read</span>
            </button>
          )}
        </div>

        <div className={cn(
          "flex-1 overflow-y-auto px-3 py-3 transition-opacity duration-300",
          rightSidebarCollapsed && "opacity-0 pointer-events-none"
        )}>
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 rounded-full border-2 border-gray-200 dark:border-[#2a2a2a] border-t-[#c8864e] animate-spin" />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-8 w-8 text-gray-200 dark:text-[#333] mb-2" />
              <p className="text-sm text-gray-400 dark:text-[#555]">No notifications yet</p>
            </div>
          )}

          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markRead(n.id) }}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer transition-colors",
                  n.read
                    ? "border-gray-100 dark:border-[#222] bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    : "border-[#c8864e]/30 dark:border-[#c8864e]/20 bg-[#c8864e]/5 dark:bg-[#c8864e]/10 hover:bg-[#c8864e]/10"
                )}
              >
                {n.link ? (
                  <Link href={n.link} className="block">
                    <NotifContent n={n} />
                  </Link>
                ) : (
                  <NotifContent n={n} />
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

function NotifContent({ n }: { n: Notification }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex-shrink-0">{typeIcon[n.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-gray-900 dark:text-[#e8e2db]",
          !n.read && "font-semibold"
        )}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-[#777] mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[10px] text-gray-400 dark:text-[#555] mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.read && (
        <div className="h-1.5 w-1.5 rounded-full bg-[#c8864e] flex-shrink-0 mt-1.5" />
      )}
    </div>
  )
}
