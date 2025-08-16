import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/landing',
  '/auth/login',
  '/auth/register',
  '/auth/signup',
  '/api/auth/pin/login',
  '/api/auth/pin/register',
];

// Define API routes that should be handled separately
const apiRoutes = ['/api/'];

// Define static assets and Next.js internal routes to ignore
const ignoredRoutes = [
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for ignored routes (static assets, etc.)
  if (ignoredRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip middleware for API routes (they handle their own auth)
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow access to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    // If no auth header, try to get token from cookies
    if (!token) {
      token = request.cookies.get('auth-token')?.value;
    }

    // If no token found, redirect to login
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate the session
    const session = await validateSession(token);
    
    if (!session) {
      // Invalid session, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Valid session, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware authentication error:', error);
    
    // On error, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};