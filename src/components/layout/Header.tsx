'use client'

import { Sun, Moon, Bell, Menu, PanelRight, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const { toggleLeftSidebar, toggleRightSidebar } = useUIStore()
  const { token, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!token) return
    const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF'

    const fetchCounts = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
          isStaff
            ? fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve(null),
        ])
        if (notifRes.ok) setUnreadNotifs((await notifRes.json()).unreadCount ?? 0)
        if (msgRes?.ok) setUnreadMessages((await msgRes.json()).totalUnread ?? 0)
      } catch {}
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 60_000)
    return () => clearInterval(interval)
  }, [token, user?.role])

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF'

  return (
    <header className="relative z-50 flex h-14 items-center justify-between border-b border-[#e5e7eb] dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4">
      {/* Left — hamburger (clearly not a back button) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-500 dark:text-[#888]"
        onClick={toggleLeftSidebar}
        title="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Right — theme + messaging + bell + panel */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 dark:text-[#888]"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {isStaff && (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-gray-500 dark:text-[#888]"
            onClick={() => router.push('/messages')}
            title="Messages"
          >
            <MessageSquare className="h-4 w-4" />
            {unreadMessages > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c8864e] text-[9px] font-bold text-white">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-gray-500 dark:text-[#888]"
          onClick={toggleRightSidebar}
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotifs > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c8864e] text-[9px] font-bold text-white">
              {unreadNotifs > 9 ? '9+' : unreadNotifs}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 dark:text-[#888]"
          onClick={toggleRightSidebar}
          title="Toggle panel"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
