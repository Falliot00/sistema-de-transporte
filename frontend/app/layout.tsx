// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter } from 'next/font/google';
import { ThemeProvider } from './theme-provider';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { RoleProvider } from '@/components/providers/role-provider';
import { decodeAuthToken } from '@/lib/token';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grupo Alliot - Sistema de Alarmas',
  description: 'Sistema de gestión de alarmas Grupo Alliot',
  icons: { // AÑADIDO: Configuración del Favicon y otros íconos
    icon: '/logo-grupo-alliot.png', // Favicon estándar
    shortcut: '/logo-grupo-alliot.png', // Para algunos navegadores y accesos directos
    apple: '/logo-grupo-alliot.png', // Para Apple touch icon
    other: [ // Opcional: para especificar otros tipos si es necesario
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/logo-grupo-alliot.png',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = cookies();
  const token = jar.get('token')?.value;
  const payload = await decodeAuthToken(token);
  const role = payload?.role ?? 'USER';
  const username =
    payload?.username ??
    (typeof payload?.sub === 'string' ? payload?.sub : undefined);

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <RoleProvider value={{ role, username }}>
            {children}
            <ShadcnToaster />
            <SonnerToaster />
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
