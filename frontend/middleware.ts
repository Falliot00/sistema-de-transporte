import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/logo-grupo-alliot.png'];
const startsWithAny = (path: string, prefixes: string[]) => prefixes.some((p) => path.startsWith(p));

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir paths públicos y assets
  if (startsWithAny(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  const role = req.cookies.get('role')?.value || 'USER';

  // Si no hay token, redirigir al login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Evitar acceder al login si ya está autenticado
  if (pathname === '/login' && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Restricciones por rol
  if (role === 'USER') {
    const restricted = ['/devices', '/drivers', '/dashboard'];
    if (restricted.some((p) => pathname.startsWith(p))) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('unauthorized', '1');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api).*)'],
};
