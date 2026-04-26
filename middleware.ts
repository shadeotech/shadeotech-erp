import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register'];

// Protected route patterns
const protectedRoutes = [
  '/dashboard',
  '/dealer',
  '/portal',
  '/franchise',
  '/customers',
  '/quotes',
  '/invoices',
  '/payments',
  '/calendar',
  '/production',
  '/sales',
  '/projects',
  '/profile',
  '/settings',
  '/accounting',
  '/contracts',
  '/corporate',
  '/blog',
  '/social',
  '/tasks',
  '/tickets',
  '/leads',
  '/notifications',
  '/permissions',
  '/reports',
  '/delivery-installation',
  '/fabric-gallery',
  '/ecommerce',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // If accessing a public route, allow it
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // If accessing a protected route, check for auth token
  if (isProtectedRoute) {
    // Check for token in cookies or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
