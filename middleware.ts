import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login')
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')
    const isPublicApiRoute = req.nextUrl.pathname.startsWith('/api/public')
    const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

    // Allow access to auth API routes and public API routes
    if (isApiAuthRoute || isPublicApiRoute) {
      return NextResponse.next()
    }

    // For other API routes, let them handle their own authentication
    if (isApiRoute) {
      return NextResponse.next()
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // Redirect unauthenticated users to login
    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Role-based access control
    const userRole = token.role as string
    const pathname = req.nextUrl.pathname

    // Admin-only routes
    const adminRoutes = ['/employees', '/settings', '/scanners']
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Manager and Admin routes
    const managerRoutes = ['/reports']
    if (managerRoutes.some(route => pathname.startsWith(route))) {
      if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This callback is called for every request
        // Return true to allow access, false to deny
        return true // We handle authorization in the middleware function above
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}