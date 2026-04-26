'use client'

import { Sun, Moon, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toggleLeftSidebar } = useUIStore()
  const { user } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const initials =
    ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 dark:text-[#888] hover:text-gray-900 dark:hover:text-[#e8e2db]"
          onClick={toggleLeftSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <span className="text-sm text-gray-400 dark:text-[#555]">Customer Portal</span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-[#c8864e]/15 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-[#c8864e]">{initials}</span>
            </div>
            <span className="text-sm text-gray-700 dark:text-[#ccc]">
              {user.firstName} {user.lastName}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 dark:text-[#888] hover:text-gray-900 dark:hover:text-[#e8e2db]"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  )
}
