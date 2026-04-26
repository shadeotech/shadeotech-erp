'use client'

import { Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toggleLeftSidebar, toggleRightSidebar, leftSidebarCollapsed, rightSidebarCollapsed } = useUIStore()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="relative z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 px-6">
      {/* Left - Breadcrumb with Left Sidebar Toggle */}
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 dark:text-gray-400"
          onClick={toggleLeftSidebar}
        >
          {leftSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <span className="text-gray-600 dark:text-gray-300">Dealer Portal</span>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 dark:text-gray-400"
          onClick={toggleRightSidebar}
        >
          {rightSidebarCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-500 dark:text-gray-400"
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

