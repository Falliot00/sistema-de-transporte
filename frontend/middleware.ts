import { NextRequest, NextResponse } from 'next/server';
import { decodeAuthToken } from '@/lib/token';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/logo-grupo-alliot.png'];
const RESTRICTED_FOR_USER = ['/devices', '/drivers', '/dashboard'];
const startsWithAny = (path: string, prefixes: string[]) => prefixes.some((p) => path.startsWith(p));
const isProd = process.env.NODE_ENV === 'production';
const SHARED_SSO_SECRET = process.env.AUTH_SSO_SHARED_SECRET;

const HEADER_USER = (process.env.AUTH_SSO_HEADER_USER || 'X-Forwarded-Preferred-Username').toLowerCase();
const HEADER_EMAIL = (process.env.AUTH_SSO_HEADER_EMAIL || 'X-Forwarded-Email').toLowerCase();
const HEADER_NAME = (process.env.AUTH_SSO_HEADER_NAME || 'X-Forwarded-User').toLowerCase();
const HEADER_GROUPS = (process.env.AUTH_SSO_HEADER_GROUPS || 'X-Forwarded-Groups').toLowerCase();

const BACKEND_LOGIN_PATH = '/auth/sso-login';

function backendBase() {
  const normalize = (url: string) => {
    const trimmed = url.replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  };
  const internal = process.env.BACKEND_INTERNAL_URL;
  if (internal && internal.trim()) {
    return normalize(internal.trim());
  }
  const apiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && apiUrl.trim()) {
    return normalize(apiUrl.trim());
  }
  return 'http://localhost:3001/api';
}

function parseGroups(value: string | null): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
    }
  } catch {
    // No es JSON, seguimos con split
  }

  return trimmed
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function attemptSsoBootstrap(req: NextRequest): Promise<NextResponse | null> {
  if (!SHARED_SSO_SECRET) return null;
  if (req.method !== 'GET') return null;

  const username = req.headers.get(HEADER_USER) || req.headers.get('x-forwarded-user');
  if (!username) {
    return null;
  }

  const email = req.headers.get(HEADER_EMAIL) || undefined;
  const fullName = req.headers.get(HEADER_NAME) || undefined;
  const groupsHeader = req.headers.get(HEADER_GROUPS) || req.headers.get('x-forwarded-groups');
  const groups = parseGroups(groupsHeader);

  const ssoUrl = `${backendBase()}${BACKEND_LOGIN_PATH}`;
  try {
    const resp = await fetch(ssoUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-sso-secret': SHARED_SSO_SECRET,
      },
      body: JSON.stringify({ username, email, name: fullName, groups }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data?.token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      if (data?.message) {
        loginUrl.searchParams.set('error', data.message);
      } else {
        loginUrl.searchParams.set('error', 'No se pudo crear la sesión SSO');
      }
      return NextResponse.redirect(loginUrl);
    }

    const redirectUrl = req.nextUrl.clone();
    const nextResponse = NextResponse.redirect(redirectUrl);
    nextResponse.cookies.set('token', data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return nextResponse;
  } catch (error) {
    console.error('[middleware] Error al intercambiar token SSO:', error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (startsWithAny(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  let role = 'USER';

  if (!token) {
    const ssoResponse = await attemptSsoBootstrap(req);
    if (ssoResponse) {
      return ssoResponse;
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const payload = await decodeAuthToken(token);
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    url.searchParams.set('error', 'Sesi\u00f3n inv\u00e1lida');
    return NextResponse.redirect(url);
  }
  role = typeof payload.role === 'string' ? payload.role : 'USER';

  if (pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (role === 'USER' && RESTRICTED_FOR_USER.some((p) => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('unauthorized', '1');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|proxy).*)'],
};
