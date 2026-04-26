import type { Permission } from './permissions';

// Map routes to required permissions
export const routePermissionMap: Record<string, Permission> = {
  '/dashboard': 'view_dashboard',
  '/calendar': 'view_calendar',
  '/customers': 'view_customers',
  '/sales': 'view_sales',
  '/quotes': 'view_quotes',
  '/invoices': 'view_invoices',
  '/payments': 'view_payments',
  '/production': 'view_production',
  '/production/pending-approval': 'view_production',
  '/production/orders': 'view_production',
  '/production/schedule': 'view_production',
  '/production/workshop': 'view_production',
  '/production/inventory': 'view_production',
  '/delivery-installation': 'view_delivery',
  '/contracts': 'view_contracts',
  '/tasks': 'view_tasks',
  '/leads': 'view_leads',
  '/accounting': 'view_accounting',
  '/reports': 'view_reports',
  '/tickets': 'view_tickets',
  '/settings': 'view_settings',
  '/permissions': 'view_settings',
  '/fabric-gallery': 'view_production',
};

// Get required permission for a route
export function getRoutePermission(pathname: string): Permission | null {
  // Check exact matches first
  if (routePermissionMap[pathname]) {
    return routePermissionMap[pathname];
  }
  
  // Check if pathname starts with any route
  for (const [route, permission] of Object.entries(routePermissionMap)) {
    if (pathname.startsWith(route)) {
      return permission;
    }
  }
  
  return null;
}
