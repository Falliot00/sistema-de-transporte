import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function normalizeApiBase(url: string) {
  const trimmed = url.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function backendBase() {
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

  console.log('[PROXY] Forward request:', {
    method: req.method,
    path,
    joined,
    targetUrl,
    base,
    search: req.nextUrl.search
  });

  const headers = new Headers();
  headers.set('accept', 'application/json');

  const jar = await cookies();
  const token = jar.get('token')?.value;
  console.log('[PROXY] Token found:', !!token);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.text() : undefined;
  if (hasBody) {
    headers.set('content-type', 'application/json');
  }

  try {
    console.log('[PROXY] Making request to:', targetUrl);
    console.log('[PROXY] With headers:', Object.fromEntries(headers.entries()));
    
    const resp = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    console.log('[PROXY] Response:', {
      status: resp.status,
      statusText: resp.statusText,
      headers: Object.fromEntries(resp.headers.entries())
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('[PROXY] Backend error response:', errorText);
    }

    const respHeaders = new Headers(resp.headers);
    respHeaders.set('access-control-allow-origin', '*');
    
    return new NextResponse(resp.body, { 
      status: resp.status, 
      statusText: resp.statusText,
      headers: respHeaders 
    });
  } catch (error) {
    console.error('[PROXY] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(
      JSON.stringify({ 
        error: 'Proxy error', 
        details: errorMessage,
        targetUrl 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
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

