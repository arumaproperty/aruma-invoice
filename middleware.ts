import { NextRequest, NextResponse } from 'next/server';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and login API through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) {
    return NextResponse.next();
  }

  // Allow static assets through
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname === '/icon.svg' ||
    pathname === '/icon.png'
  ) {
    return NextResponse.next();
  }

  // Check auth cookie
  const cookie = req.cookies.get('aruma_auth')?.value;
  const password = process.env.APP_PASSWORD ?? '';
  const expected = await hashPassword(password);

  if (cookie !== expected) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
