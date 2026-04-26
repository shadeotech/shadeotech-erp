'use client'

import { Sidebar } from '@/components/layout/DealerSidebar'
import { Header } from '@/components/layout/DealerHeader'
import { NotificationsSidebar } from '@/components/layout/NotificationsSidebar'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const { leftSidebarCollapsed, rightSidebarCollapsed, setLeftSidebarCollapsed, setRightSidebarCollapsed } = useUIStore()

  // Check authentication and role
  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.role === 'CUSTOMER') router.push('/portal')
    else if (user?.role === 'ADMIN' || user?.role === 'STAFF') router.push('/dashboard')
  }, [isAuthenticated, isLoading, user?.role, router])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarCollapsed(true)
        setRightSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setLeftSidebarCollapsed, setRightSidebarCollapsed])

  // Show loading or nothing while checking auth
  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <NotificationsSidebar />
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          leftSidebarCollapsed ? "lg:pl-0" : "lg:pl-60",
          rightSidebarCollapsed ? "lg:pr-0" : "lg:pr-64"
        )}
      >
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

