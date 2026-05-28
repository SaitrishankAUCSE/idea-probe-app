import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/validate', '/history'];

export function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If the user tries to access a protected route without a session cookie,
  // redirect them to the login page.
  // Note: This only checks for cookie presence to avoid heavy Edge runtime checks.
  // The actual Firebase session verification happens in the AuthGuard on the client
  // and in individual API routes on the server.
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is on the login/signup page but already has a session,
  // redirect them to the dashboard.
  if ((pathname === '/login' || pathname === '/signup') && session) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher for paths to run the middleware on
  matcher: [
    '/dashboard/:path*',
    '/validate/:path*',
    '/history/:path*',
    '/login',
    '/signup'
  ]
}
