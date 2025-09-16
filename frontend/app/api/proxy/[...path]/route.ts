import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function backendBase() {
  // En producción, usar la URL interna del backend
  // En desarrollo, usar localhost
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // URL interna para comunicación entre servicios en producción
    return process.env.BACKEND_INTERNAL_URL || 'https://alarmas.monteverasrl.com.ar/api';
  }
  
  // Para desarrollo
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const t = raw.replace(/\/$/, '');
  return t.endsWith('/api') ? t : `${t}/api`;
}

async function forward(req: NextRequest, path: string[]) {
  const base = backendBase();
  const joined = path?.join('/') || '';
  const targetUrl = `${base}/${joined}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.set('accept', 'application/json');

  const jar = await cookies();
  const token = jar.get('token')?.value;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.text() : undefined;

  const resp = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
  });

  const respHeaders = new Headers(resp.headers);
  // Asegura CORS mínimo cuando se usa desde el navegador
  respHeaders.set('access-control-allow-origin', '*');
  return new NextResponse(resp.body, { status: resp.status, headers: respHeaders });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
