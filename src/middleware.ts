import { NextResponse, type NextRequest } from 'next/server';

const APP_PREFIX = '/app';
const LOGIN_PATH = '/login';

export function middleware(request: NextRequest) {
  const hasAccessToken = request.cookies.has('sb-access-token');
  const hasRefreshToken = request.cookies.has('sb-refresh-token');
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  if (request.nextUrl.pathname.startsWith(APP_PREFIX) && !isAuthenticated) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
