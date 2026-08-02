import { NextResponse } from 'next/server';
import { isAuthedFromCookieHeader } from '@/lib/adminAuth';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login';
  const isAdminPage = pathname.startsWith('/admin/dashboard');

  if (!isAdminApi && !isAdminPage) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get('cookie');
  const authed = isAuthedFromCookieHeader(cookieHeader);

  if (!authed) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/:path*'],
};
