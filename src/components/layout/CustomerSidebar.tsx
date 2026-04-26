'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  CreditCard,
  Ticket,
  LogOut,
  ShieldCheck,
  BookOpen,
  Wrench,
  FileSignature,
  Users,
} from 'lucide-react'

const navItems = [
  { title: 'Dashboard', href: '/portal', icon: LayoutDashboard },
  { title: 'Estimates', href: '/portal/quotes', icon: FileText },
  { title: 'Contracts', href: '/portal/contracts', icon: FileSignature },
  { title: 'Invoices', href: '/portal/invoices', icon: Receipt },
  { title: 'Payments', href: '/portal/payments', icon: CreditCard },
  { title: 'Referrals', href: '/portal/referrals', icon: Users },
  { title: 'Warranty', href: '/portal/warranty', icon: ShieldCheck },
  { title: 'Help Library', href: '/portal/help-library', icon: BookOpen },
  { title: 'Care & Maintenance', href: '/portal/care-maintenance', icon: Wrench },
  { title: 'Tickets', href: '/portal/tickets', icon: Ticket },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { leftSidebarCollapsed, setLeftSidebarCollapsed } = useUIStore()
  const { logout } = useAuthStore()

  const isActive = (href: string) => {
    if (href === '/portal') return pathname === '/portal' || pathname === '/portal/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {!leftSidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setLeftSidebarCollapsed(true)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] transition-all duration-300 ease-in-out',
          leftSidebarCollapsed ? 'w-0 overflow-hidden -translate-x-full lg:translate-x-0' : 'w-60'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 items-center gap-3 px-4 border-b border-gray-100 dark:border-[#2a2a2a] shrink-0 transition-opacity duration-300',
            leftSidebarCollapsed && 'opacity-0'
          )}
        >
          <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0">
            <Image
              src="/images/logoshad.webp"
              alt="Shadeotech"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db] leading-tight truncate">
              Shadeotech
            </p>
            <p className="text-[10px] text-gray-400 dark:text-[#555] uppercase tracking-widest">
              Customer Portal
            </p>
          </div>
        </div>

        {/* Nav */}
        <div
          className={cn(
            'flex-1 overflow-y-auto px-3 py-4 transition-opacity duration-300',
            leftSidebarCollapsed && 'opacity-0 pointer-events-none'
          )}
        >
          <p className="text-[10px] font-medium text-gray-400 dark:text-[#555] uppercase tracking-widest px-2.5 mb-3">
            Menu
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150',
                    active
                      ? 'bg-[#c8864e]/10 text-[#c8864e]'
                      : 'text-gray-600 dark:text-[#999] hover:bg-gray-100 dark:hover:bg-[#1e1e1e] hover:text-gray-900 dark:hover:text-[#e8e2db]'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-[#c8864e]' : '')} />
                  <span className="truncate">{item.title}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c8864e] shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'border-t border-gray-100 dark:border-[#2a2a2a] px-3 py-3 shrink-0 transition-opacity duration-300',
            leftSidebarCollapsed && 'opacity-0 pointer-events-none'
          )}
        >
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-500 dark:text-[#666] hover:bg-gray-100 dark:hover:bg-[#1e1e1e] hover:text-gray-900 dark:hover:text-[#e8e2db] transition-all duration-150"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
