import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function normalizeApiBase(url: string) {
  const trimmed = url.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function backendBase() {
  const internal = process.env.BACKEND_INTERNAL_URL;
  if (internal && internal.trim()) {
    return normalizeApiBase(internal.trim());
  }
  const envBase = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envBase && envBase.trim()) {
    return normalizeApiBase(envBase.trim());
  }
  return 'http://localhost:3001/api';
}

async function forward(req: NextRequest, path: string[]) {
  const base = backendBase();
  const joined = path?.join('/') || '';
  const targetUrl = `${base}/${joined}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set('accept', 'application/json');

  const jar = await cookies();
  const token = jar.get('token')?.value;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.text() : undefined;
  if (hasBody) headers.set('content-type', 'application/json');

  try {
    const resp = await fetch(targetUrl, { method: req.method, headers, body });
    const respHeaders = new Headers(resp.headers);
    respHeaders.set('access-control-allow-origin', '*');
    return new NextResponse(resp.body, { status: resp.status, statusText: resp.statusText, headers: respHeaders });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(
      JSON.stringify({ error: 'Proxy error', details: errorMessage, targetUrl }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(req: NextRequest, context: any) {
  const { path = [] } = context.params || {};
  return forward(req, Array.isArray(path) ? path : []);
}
export async function POST(req: NextRequest, context: any) {
  const { path = [] } = context.params || {};
  return forward(req, Array.isArray(path) ? path : []);
}
export async function PUT(req: NextRequest, context: any) {
  const { path = [] } = context.params || {};
  return forward(req, Array.isArray(path) ? path : []);
}
export async function PATCH(req: NextRequest, context: any) {
  const { path = [] } = context.params || {};
  return forward(req, Array.isArray(path) ? path : []);
}
export async function DELETE(req: NextRequest, context: any) {
  const { path = [] } = context.params || {};
  return forward(req, Array.isArray(path) ? path : []);
}

