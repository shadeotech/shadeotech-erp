'use client'

import { Sidebar } from '@/components/layout/CustomerSidebar'
import { Header } from '@/components/layout/CustomerHeader'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const { leftSidebarCollapsed, setLeftSidebarCollapsed } = useUIStore()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.push('/login'); return }
    if (user?.role === 'DEALER') router.push('/dealer')
    else if (user?.role === 'ADMIN' || user?.role === 'STAFF') router.push('/dashboard')
  }, [isAuthenticated, isLoading, user?.role, router])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setLeftSidebarCollapsed(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setLeftSidebarCollapsed])

  if (isLoading || !isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#f7f5f2] dark:bg-[#0f0f0f]">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          leftSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-60'
        )}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
