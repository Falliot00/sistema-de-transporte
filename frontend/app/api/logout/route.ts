import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const jar = await cookies();
  // Borrar cookies estableciendo maxAge 0
  jar.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
  jar.set('role', '', { httpOnly: false, path: '/', maxAge: 0 });
  return NextResponse.json({ ok: true });
}

