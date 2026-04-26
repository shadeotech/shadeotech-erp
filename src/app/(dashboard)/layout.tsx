'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { RightSidebar } from '@/components/dashboard/RightSidebar'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getRoutePermission } from '@/lib/route-permissions'
import { hasPermission } from '@/lib/permissions'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { leftSidebarCollapsed, rightSidebarCollapsed, setLeftSidebarCollapsed, setRightSidebarCollapsed } = useUIStore()

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Check permissions for STAFF users
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role === 'STAFF') {
      const requiredPermission = getRoutePermission(pathname)
      if (requiredPermission && !hasPermission(user, requiredPermission)) {
        // Redirect to dashboard if they don't have permission
        router.push('/dashboard')
      }
    }
  }, [pathname, user, isAuthenticated, isLoading, router])

  // Collapse sidebars on mobile on initial load
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // On mobile, ensure sidebars are collapsed
        setLeftSidebarCollapsed(true)
        setRightSidebarCollapsed(true)
      }
    }

    // Check on mount
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setLeftSidebarCollapsed, setRightSidebarCollapsed])

  // Show loading or nothing while checking auth
  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <Sidebar />
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out",
          // Mobile: no padding (sidebars overlay), Desktop: padding based on sidebar state
          leftSidebarCollapsed ? "lg:pl-0" : "lg:pl-60",
          rightSidebarCollapsed ? "lg:pr-0" : "lg:pr-64"
        )}
      >
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
      <RightSidebar />
    </div>
  )
}
