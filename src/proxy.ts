import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('session_token')?.value;
  const user = token ? verifyToken(token) : null;

  // Protect superadmin routes
  if (pathname.startsWith('/superadmin')) {
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/superadmin/:path*', '/login', '/register'],
};
