import type { User } from '@/types/database'

export type Permission = 
  | 'view_dashboard'
  | 'view_customers'
  | 'view_contacts'
  | 'view_production'
  | 'view_sales'
  | 'view_quotes'
  | 'view_invoices'
  | 'view_payments'
  | 'view_accounting'
  | 'view_financials'
  | 'view_reports'
  | 'view_tasks'
  | 'view_leads'
  | 'view_tickets'
  | 'view_calendar'
  | 'view_contracts'
  | 'view_delivery'
  | 'view_settings'
  | 'place_orders'
  | 'pay_orders'
  | 'view_own_quotes'
  | 'view_own_invoices'
  | 'view_own_payments'
  | 'view_own_tickets'

export interface RolePermissions {
  [key: string]: Permission[]
}

// Define permissions for each role
export const rolePermissions: RolePermissions = {
  ADMIN: [
    'view_dashboard',
    'view_customers',
    'view_contacts',
    'view_production',
    'view_sales',
    'view_quotes',
    'view_invoices',
    'view_payments',
    'view_accounting',
    'view_financials',
    'view_reports',
    'view_tasks',
    'view_leads',
    'view_tickets',
    'view_calendar',
    'view_contracts',
    'view_delivery',
    'view_settings',
  ],
  STAFF: [
    'view_dashboard',
    'view_customers',
    'view_contacts',
    'view_production',
    'view_sales',
    'view_quotes',
    'view_invoices',
    'view_tasks',
    'view_leads',
    'view_tickets',
    'view_calendar',
    'view_contracts',
    'view_delivery',
    // No financials: payments, accounting, reports
  ],
  DEALER: [
    'view_dashboard',
    'place_orders',
    'pay_orders',
    'view_own_quotes',
    'view_own_invoices',
    'view_own_payments',
  ],
  CUSTOMER: [
    'view_dashboard',
    'view_own_quotes',
    'view_own_invoices',
    'view_own_payments',
    'view_own_tickets',
  ],
  FRANCHISEE: [
    'view_dashboard',
    'view_own_quotes',
    'view_own_invoices',
    'view_own_payments',
  ],
}

// Staff granular permissions (can be set per user)
export interface StaffPermissions {
  canViewContacts: boolean
  canViewProduction: boolean
  canViewSales: boolean
  canViewTasks: boolean
  canViewLeads: boolean
  canViewTickets: boolean
}

export const defaultStaffPermissions: StaffPermissions = {
  canViewContacts: true,
  canViewProduction: true,
  canViewSales: true,
  canViewTasks: true,
  canViewLeads: true,
  canViewTickets: true,
}

// Map permission category IDs to Permission types
export const categoryToPermissionMap: Record<string, Permission[]> = {
  sales: ['view_sales', 'view_quotes', 'view_invoices', 'view_payments'],
  reports: ['view_reports'],
  production: ['view_production'],
  contacts: ['view_contacts', 'view_customers'],
  tasks: ['view_tasks'],
  leads: ['view_leads'],
  tickets: ['view_tickets'],
  accounting: ['view_accounting', 'view_financials'],
  delivery: ['view_delivery'],
  calendar: ['view_calendar'],
}

// Check if user has permission
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  
  // ADMIN always has all permissions
  if (user.role === 'ADMIN') {
    return true
  }
  
  // For STAFF users, ONLY check dynamic permissions from database (no fallback)
  if (user.role === 'STAFF') {
    // Always check permissions object - if it doesn't exist or is empty, no access
    if (user.permissions && typeof user.permissions === 'object') {
      // Check if any category that grants this permission has access level > 'no'
      for (const [categoryId, permissions] of Object.entries(categoryToPermissionMap)) {
        if (permissions.includes(permission)) {
          const accessLevel = user.permissions[categoryId]
          // If access level is 'read', 'edit', or 'full', user has permission to view
          if (accessLevel && accessLevel !== 'no') {
            return true
          }
        }
      }
      // If permission not found in any category or all are 'no', return false
      return false
    }
    // If no permissions object exists, default to no access for STAFF
    // Only allow dashboard access if no permissions are set
    return permission === 'view_dashboard'
  }
  
  // For other roles (DEALER, CUSTOMER, FRANCHISEE), use role-based permissions
  const rolePerms = rolePermissions[user.role] || []
  return rolePerms.includes(permission)
}

// Check if user has any of the permissions
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.some(perm => hasPermission(user, perm))
}

// Check if user has all permissions
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.every(perm => hasPermission(user, perm))
}

// Get access level for a permission category (for STAFF users)
export function getCategoryAccessLevel(
  user: User | null, 
  categoryId: string
): 'no' | 'read' | 'edit' | 'full' | null {
  if (!user || user.role !== 'STAFF' || !user.permissions) {
    return null
  }
  
  const accessLevel = user.permissions[categoryId]
  if (!accessLevel || accessLevel === 'no') {
    return 'no'
  }
  
  return accessLevel as 'read' | 'edit' | 'full'
}

// Check if user can view (has read, edit, or full access)
export function canView(user: User | null, categoryId: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  
  if (user.role === 'STAFF' && user.permissions) {
    const accessLevel = user.permissions[categoryId]
    return accessLevel === 'read' || accessLevel === 'edit' || accessLevel === 'full'
  }
  
  return false
}

// Check if user can perform actions (has edit or full access) - shows action buttons
export function canPerformActions(user: User | null, categoryId: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  
  if (user.role === 'STAFF' && user.permissions) {
    const accessLevel = user.permissions[categoryId]
    return accessLevel === 'edit' || accessLevel === 'full'
  }
  
  return false
}

// Check if user can edit (has edit or full access)
export function canEdit(user: User | null, categoryId: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  
  if (user.role === 'STAFF' && user.permissions) {
    const accessLevel = user.permissions[categoryId]
    return accessLevel === 'edit' || accessLevel === 'full'
  }
  
  return false
}

// Check if user can delete (has full access)
export function canDelete(user: User | null, categoryId: string): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  
  if (user.role === 'STAFF' && user.permissions) {
    const accessLevel = user.permissions[categoryId]
    return accessLevel === 'full'
  }
  
  return false
}

