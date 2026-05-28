import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and login API through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) {
    return NextResponse.next();
  }

  // Allow static assets through
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname === '/logo.png') {
    return NextResponse.next();
  }

  // Check auth cookie
  const cookie = req.cookies.get('aruma_auth')?.value;
  const password = process.env.APP_PASSWORD ?? '';
  const expected = createHash('sha256').update(password).digest('hex');

  if (cookie !== expected) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
