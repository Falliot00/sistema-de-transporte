// frontend/app/login/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';

async function loginAction(formData: FormData) {
  'use server';

  const username = String(formData.get('username') || '');
  const password = String(formData.get('password') || '');

  const envBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  const loginUrl = envBase
    ? (envBase.endsWith('/api') ? `${envBase}/auth/login` : `${envBase}/api/auth/login`)
    : 'http://localhost:3001/api/auth/login';

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    // Preserve query para mostrar el error en la UI
    redirect(`/login?error=${encodeURIComponent('Credenciales inválidas')}`);
  }

  const data = await res.json();
  const token: string = data.token;
  const role: string = data.user?.role || 'USER';

  const secure = process.env.NODE_ENV === 'production';
  // En Next 15 cookies() es asíncrono en Server Actions
  const jar = await cookies();
  // Token en cookie HTTPOnly
  jar.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 8, // 8h
  });
  // Rol legible por el cliente para mostrar/hidear menús
  jar.set('role', role, { httpOnly: false, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 2 });

  redirect('/dashboard');
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const error = sp?.error;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo-grupo-alliot.png" alt="Logo" width={140} height={40} />
          <h1 className="mt-2 text-xl font-semibold">Ingresar</h1>
        </div>
        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="username">Usuario</label>
            <input id="username" name="username" className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="password">Contraseña</label>
            <input id="password" type="password" name="password" className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded text-sm">Entrar</button>
        </form>
      </div>
    </div>
  );
}
