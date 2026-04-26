'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  FileText,
  Receipt,
  LogOut,
  Ticket,
  Settings,
  Calculator,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { 
    title: 'Dashboard', 
    href: '/dealer', 
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  { 
    title: 'Place Order', 
    href: '/dealer/orders/new', 
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  { 
    title: 'Estimates', 
    href: '/dealer/estimates', 
    icon: <Calculator className="h-4 w-4" />,
  },
  { 
    title: 'My Orders', 
    href: '/dealer/orders', 
    icon: <FileText className="h-4 w-4" />,
  },
  { 
    title: 'Payments', 
    href: '/dealer/payments', 
    icon: <CreditCard className="h-4 w-4" />,
  },
  { 
    title: 'Invoices', 
    href: '/dealer/invoices', 
    icon: <Receipt className="h-4 w-4" />,
  },
  { 
    title: 'Tickets', 
    href: '/dealer/tickets', 
    icon: <Ticket className="h-4 w-4" />,
  },
  { 
    title: 'Settings', 
    href: '/dealer/settings', 
    icon: <Settings className="h-4 w-4" />,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { leftSidebarCollapsed } = useUIStore()
  const { logout } = useAuthStore()

  const isActive = (href: string) => {
    // For dashboard (/dealer), only match exact path or /dealer/
    if (href === '/dealer') {
      return pathname === '/dealer' || pathname === '/dealer/'
    }
    // For other routes, match exact path or paths that start with the href + '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
    router.refresh()
  }

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
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out",
          leftSidebarCollapsed 
            ? "w-0 overflow-hidden -translate-x-full lg:translate-x-0" 
            : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-14 items-center gap-2 px-4 transition-opacity duration-300",
          leftSidebarCollapsed && "opacity-0"
        )}>
          <div className="relative h-7 w-7 overflow-hidden rounded-full bg-white dark:bg-gray-700">
            <Image
              src="/images/logoshad.webp"
              alt="Shadeotech logo"
              fill
              sizes="28px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Dealer Portal</span>
        </div>

        {/* Navigation Items */}
        <div className={cn(
          "flex-1 overflow-y-auto px-3 py-2 transition-opacity duration-300",
          leftSidebarCollapsed && "opacity-0 pointer-events-none"
        )}>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
                  isActive(item.href) && 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                )}
              >
                <span className="text-gray-900 dark:text-gray-200">{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className={cn(
          "border-t border-gray-200 dark:border-gray-700 px-3 py-2 transition-opacity duration-300",
          leftSidebarCollapsed && "opacity-0 pointer-events-none"
        )}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4 text-gray-900 dark:text-gray-200" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

