import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session';

/**
 * Protects the admin panel on the server:
 *  - /admin/*            pages  -> redirect to /admin/login without a valid session
 *  - /api/admin/*        APIs   -> 401 without a valid session
 *  - /api/products, /api/store/config: reads stay public, writes need a session
 * The POS till (/pos, /api/pos/*) is not covered here; it has its own PIN / sync key.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const isPublicRead =
    (pathname === '/api/products' || pathname === '/api/store/config') &&
    (req.method === 'GET' || req.method === 'HEAD');
  if (isPublicRead) return NextResponse.next();

  const authed = await verifyAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (authed) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, error: 'Unauthorized: admin login required.' }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/products', '/api/store/config'],
};
