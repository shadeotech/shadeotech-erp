'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission, type Permission } from '@/lib/permissions'
import {
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  GraduationCap,
  User,
  FileText,
  Users,
  ChevronRight,
  Star,
  Clock,
  StarOff,
  Settings,
  Receipt,
  MessageCircle,
  Factory,
  Calendar,
  Inbox,
  CheckSquare,
  TrendingUp,
  BarChart3,
  LogOut,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
  hasArrow?: boolean
  permission?: Permission
  children?: { title: string; href: string; permission?: Permission }[]
}

const favorites: { title: string; href: string }[] = []

// Navigation items matching the image structure
const navItems: NavItem[] = [
  { 
    title: 'Dashboard', 
    href: '/dashboard', 
    icon: <LayoutDashboard className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_dashboard' as const,
  },
  { 
    title: 'Calendar',
    href: '/calendar',
    icon: <Calendar className="h-4 w-4" />,
    permission: 'view_calendar' as const,
  },
  {
    title: 'Appointment Requests',
    href: '/requests',
    icon: <Inbox className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_calendar' as const,
  },
  {
    title: 'Contacts',
    href: '/customers',
    icon: <Users className="h-4 w-4" />,
    hasArrow: true,
    permission: 'view_customers' as const,
    children: [
      { title: 'Customers', href: '/customers', permission: 'view_customers' },
      { title: 'Leads', href: '/leads', permission: 'view_leads' },
      { title: "At Shades Fr's", href: '/franchise/franchisees' },
      { title: 'Referrals', href: '/referrals' },
    ],
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: <GraduationCap className="h-4 w-4" />,
    hasArrow: true,
    permission: 'view_sales' as const,
    children: [
      { title: 'Estimates', href: '/quotes', permission: 'view_quotes' },
      { title: 'Deals', href: '/quotes/pipeline', permission: 'view_quotes' },
      { title: 'Invoices', href: '/invoices', permission: 'view_invoices' },
      { title: 'Payments', href: '/payments', permission: 'view_payments' },
      { title: 'Claims', href: '/tickets' },
      { title: 'Delivery & Installation', href: '/delivery-installation' },
      { title: 'Agreements', href: '/contracts' },
    ],
  },
  {
    title: 'Production',
    href: '/production/pending-approval',
    icon: <Factory className="h-4 w-4" />,
    hasArrow: true,
    permission: 'view_production' as const,
    children: [
      { title: 'Pending Approval', href: '/production/pending-approval' },
      { title: 'Orders', href: '/production/orders' },
      { title: 'Schedule', href: '/production/schedule' },
      { title: 'Workshop', href: '/production/workshop' },
      { title: 'Inventory', href: '/production/inventory' },
      { title: 'Fabric Gallery', href: '/fabric-gallery' },
    ],
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: <MessageCircle className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_dashboard' as const,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: <CheckSquare className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_tasks' as const,
  },
  {
    title: 'Accounting',
    href: '/accounting',
    icon: <Receipt className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_accounting' as const,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: <BarChart3 className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_reports' as const,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: <TrendingUp className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_reports' as const,
  },
  { 
    title: 'Settings', 
    href: '/settings', 
    icon: <Settings className="h-4 w-4" />,
    hasArrow: false,
    permission: 'view_settings' as const,
  },
]

// Unlinked pages - kept for future use (not shown in sidebar but pages exist)
// These pages are still accessible via direct URL but not linked in sidebar:
// - /ecommerce
// - /projects
// - /profile
// - /corporate
// - /blog
// - /social
// - /franchise/*
// - /production/pending-approval

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Sales', 'Production', 'Contacts'])
  const [shortcutTab, setShortcutTab] = useState<'favorites' | 'recent'>('recent')
  const { leftSidebarCollapsed, recentlyViewed, addRecentlyViewed, favorites, toggleFavorite, isFavorite } = useUIStore()

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = () => {
    logout()
    router.push('/login')
    router.refresh()
  }

  // Filter nav items based on permissions
  const filteredNavItems = useMemo(() => {
    if (!user) return []
    
    // For STAFF users, ensure permissions object exists
    if (user.role === 'STAFF' && !user.permissions) {
      // If STAFF user has no permissions set, show nothing (or just dashboard)
      return navItems.filter(item => item.href === '/dashboard')
    }
    
    return navItems.filter(item => {
      // Check if user has permission for this item
      if (item.permission && !hasPermission(user, item.permission as any)) {
        return false
      }
      
      // Filter children based on permissions (create a copy to avoid mutation)
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          if (child.permission && !hasPermission(user, child.permission as any)) {
            return false
          }
          return true
        })
        // Hide parent if no children are visible
        if (filteredChildren.length === 0) {
          return false
        }
      }
      
      return true
    }).map(item => {
      // Create a copy of the item with filtered children
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            if (child.permission && !hasPermission(user, child.permission as any)) {
              return false
            }
            return true
          })
        }
      }
      return item
    })
  }, [user, user?.permissions])

  return (
    <>
      {/* Mobile backdrop */}
      {!leftSidebarCollapsed && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => useUIStore.getState().setLeftSidebarCollapsed(true)}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#e8e8e8] dark:bg-[#1c1510] border-r border-gray-300 dark:border-[#2e2318] transition-all duration-300 ease-in-out",
          leftSidebarCollapsed
            ? "w-0 overflow-hidden -translate-x-full lg:translate-x-0"
            : "w-60"
        )}
      >
      {/* Logo */}
      <div className={cn(
        "flex h-14 items-center gap-2.5 px-4 border-b border-gray-100 dark:border-[#2e2318] transition-opacity duration-300",
        leftSidebarCollapsed && "opacity-0"
      )}>
        <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gray-50 dark:bg-[#2e2318] ring-1 ring-gray-200 dark:ring-[#5a3e28] flex-shrink-0">
          <Image
            src="/images/logoshad.webp"
            alt="Shadeotech logo"
            fill
            sizes="32px"
            className="object-contain"
            priority
          />
        </div>
        <span className="text-sm font-semibold text-gray-800 dark:text-[#e8d5bf] tracking-wide">Shadeotech</span>
      </div>

      {/* Scrollable Content */}
      <div className={cn(
        "flex-1 overflow-y-auto px-2.5 py-3 transition-opacity duration-300",
        leftSidebarCollapsed && "opacity-0 pointer-events-none"
      )}>

        {/* Favorites / Recent tab switcher */}
        <div className="mb-3">
          <div className="flex items-center gap-0.5 mb-1.5">
            <button
              onClick={() => setShortcutTab('favorites')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                shortcutTab === 'favorites'
                  ? 'bg-amber-50 dark:bg-[#3a2810] text-amber-700 dark:text-[#c49a6c]'
                  : 'text-gray-500 dark:text-[#6a5040] hover:text-gray-700 dark:hover:text-[#c49a6c]'
              )}
            >
              <Star className={cn('h-3 w-3', shortcutTab === 'favorites' ? 'fill-[#c49a6c] text-[#c49a6c]' : '')} />
              Favorites
              {favorites.length > 0 && (
                <span className={cn('ml-0.5 rounded-full px-1 text-[9px] font-bold', shortcutTab === 'favorites' ? 'bg-[#e8d5bf] text-[#7a5030]' : 'bg-[#ede5db] text-[#a08878]')}>
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShortcutTab('recent')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                shortcutTab === 'recent'
                  ? 'bg-[#ede5db] dark:bg-[#2e2318] text-[#5a3820] dark:text-[#d4b896]'
                  : 'text-[#a08878] dark:text-[#6a5040] hover:text-[#5a3820] dark:hover:text-[#c49a6c]'
              )}
            >
              <Clock className="h-3 w-3" />
              Recent
            </button>
          </div>

          {shortcutTab === 'favorites' && (
            <div className="space-y-0.5 min-h-[24px]">
              {favorites.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-[#b8a898] dark:text-[#5a4030] italic">Hover any item and click ★ to pin.</p>
              ) : (
                favorites.map((item) => (
                  <div key={item.href} className="group flex items-center rounded-md hover:bg-gray-50 dark:hover:bg-[#2e2318]">
                    <Link
                      href={item.href}
                      className={cn(
                        'flex-1 flex items-center gap-2 px-2 py-1.5 text-xs text-[#7a6050] dark:text-[#b09070]',
                        isActive(item.href) && 'text-[#5a3820] dark:text-[#e8d5bf] font-medium'
                      )}
                    >
                      <Star className="h-2.5 w-2.5 fill-[#c49a6c] text-[#c49a6c] flex-shrink-0" />
                      {item.title}
                    </Link>
                    <button
                      onClick={() => toggleFavorite(item)}
                      className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#c8b8a8] hover:text-red-400"
                    >
                      <StarOff className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {shortcutTab === 'recent' && (
            <div className="space-y-0.5 min-h-[24px]">
              {recentlyViewed.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-[#b8a898] dark:text-[#5a4030] italic">Pages you visit will appear here.</p>
              ) : (
                recentlyViewed.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#9a8878] dark:text-[#907060] hover:bg-gray-50 dark:hover:bg-[#2e2318] hover:text-[#5a3820] dark:hover:text-[#d4b896]',
                      isActive(item.href) && 'bg-[#f0e6d8] dark:bg-[#2e2318] text-[#5a3820] dark:text-[#d4b896]'
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-[#c49a6c] flex-shrink-0" />
                    {item.title}
                  </Link>
                ))
              )}
            </div>
          )}

          <div className="mt-2 border-t border-gray-100 dark:border-[#2e2318]" />
        </div>

        {/* Navigation Items */}
        <div className="space-y-0.5">
          {filteredNavItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <>
                  <div className="group flex items-center rounded-lg hover:bg-gray-50 dark:hover:bg-[#2e2318]">
                    <button
                      onClick={() => toggleExpand(item.title)}
                      className={cn(
                        'flex flex-1 items-center gap-2.5 px-2 py-2 text-[13px] font-medium',
                        isActive(item.href)
                          ? 'text-amber-600 dark:text-[#c49a6c]'
                          : 'text-gray-600 dark:text-[#907060] hover:text-gray-900 dark:hover:text-[#d4b896]'
                      )}
                    >
                      <span className={cn(
                        'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors',
                        isActive(item.href)
                          ? 'bg-[#c49a6c] text-white shadow-sm shadow-[#c49a6c]/30'
                          : 'bg-gray-100 dark:bg-[#2e2318] text-gray-400 dark:text-[#7a6050] group-hover:bg-gray-200 group-hover:text-gray-600'
                      )}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronRight className={cn(
                        'h-3 w-3 transition-transform text-[#c8b8a8] dark:text-[#5a4030]',
                        expandedItems.includes(item.title) && 'rotate-90'
                      )} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite({ title: item.title, href: item.href }) }}
                      className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className={cn('h-3 w-3', isFavorite(item.href) ? 'fill-[#c49a6c] text-[#c49a6c]' : 'text-[#c8b8a8] dark:text-[#5a4030]')} />
                    </button>
                  </div>
                  {expandedItems.includes(item.title) && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 dark:border-[#3a2810] pl-3">
                      {item.children.map((child) => (
                        <div key={child.href} className="group flex items-center">
                          <Link
                            href={child.href}
                            onClick={() => addRecentlyViewed({ title: child.title, href: child.href })}
                            className={cn(
                              'flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] transition-colors',
                              pathname === child.href
                                ? 'bg-amber-50 dark:bg-[#3a2810] text-amber-700 dark:text-[#c49a6c] font-medium'
                                : 'text-gray-500 dark:text-[#7a6050] hover:bg-gray-50 dark:hover:bg-[#2e2318] hover:text-gray-700 dark:hover:text-[#d4b896]'
                            )}
                          >
                            {pathname === child.href && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#c49a6c] flex-shrink-0" />
                            )}
                            {child.title}
                          </Link>
                          <button
                            onClick={() => toggleFavorite({ title: child.title, href: child.href })}
                            className="pr-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star className={cn('h-3 w-3', isFavorite(child.href) ? 'fill-[#c49a6c] text-[#c49a6c]' : 'text-[#c8b8a8] dark:text-[#5a4030]')} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="group flex items-center rounded-lg hover:bg-gray-50 dark:hover:bg-[#2e2318]">
                  <Link
                    href={item.href}
                    onClick={() => addRecentlyViewed({ title: item.title, href: item.href })}
                    className={cn(
                      'flex flex-1 items-center gap-2.5 px-2 py-2 text-[13px] font-medium',
                      isActive(item.href)
                        ? 'text-amber-600 dark:text-[#c49a6c]'
                        : 'text-gray-600 dark:text-[#907060] hover:text-gray-900 dark:hover:text-[#d4b896]'
                    )}
                  >
                    <span className={cn(
                      'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors',
                      isActive(item.href)
                        ? 'bg-[#c49a6c] text-white shadow-sm shadow-[#c49a6c]/30'
                        : 'bg-gray-100 dark:bg-[#2e2318] text-gray-400 dark:text-[#7a6050] group-hover:bg-gray-200 group-hover:text-gray-600'
                    )}>
                      {item.icon}
                    </span>
                    {item.title}
                  </Link>
                  <button
                    onClick={() => toggleFavorite({ title: item.title, href: item.href })}
                    className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star className={cn('h-3 w-3', isFavorite(item.href) ? 'fill-[#c49a6c] text-[#c49a6c]' : 'text-[#c8b8a8] dark:text-[#5a4030]')} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className={cn(
        "border-t border-gray-100 dark:border-[#2e2318] px-2.5 py-3 transition-opacity duration-300",
        leftSidebarCollapsed && "opacity-0 pointer-events-none"
      )}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-gray-500 dark:text-[#7a6050] hover:bg-gray-50 dark:hover:bg-[#2e2318] hover:text-gray-700 dark:hover:text-[#d4b896] transition-colors"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f4ede5] dark:bg-[#2e2318] text-[#b09880] dark:text-[#7a6050]">
            <LogOut className="h-3.5 w-3.5" />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  )
}
