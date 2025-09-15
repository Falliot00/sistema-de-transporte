// frontend/components/layout/main-nav.tsx
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bell, LineChart, Users, Server } from "lucide-react";

interface MainNavProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function MainNav({ className, orientation = "vertical" }: MainNavProps) {
  const pathname = usePathname();
  const role = typeof document !== 'undefined'
    ? (document.cookie.split('; ').find(c => c.startsWith('role='))?.split('=')[1] || 'USER')
    : 'USER';

  // --- CAMBIO: Añadimos una propiedad `colorClass` a cada ruta ---
  const allRoutes = [
    {
      href: "/",
      label: "Alarmas",
      // El icono ahora está envuelto en un span para aplicar el color
      icon: <Bell className="h-5 w-5 text-black-800 dark:text-neutral-200" />,
      active: pathname === "/",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LineChart className="h-5 w-5 text-green-600 dark:text-green-500" />,
      active: pathname.startsWith("/dashboard"),
    },
    {
      href: "/drivers",
      label: "Choferes",
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
      active: pathname.startsWith("/drivers"),
    },
    {
      href: "/devices",
      label: "Dispositivos",
      icon: <Server className="h-5 w-5 text-amber-600 dark:text-amber-500" />,
      active: pathname.startsWith("/devices"),
    },
  ];

  const routes = role === 'USER'
    ? allRoutes.filter(r => r.href === '/' || r.href === '/dashboard')
    : allRoutes;

  const linkClasses = (isActive: boolean) => cn(
    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-primary hover:bg-muted"
  );

  const mobileLinkClasses = (isActive: boolean) => cn(
    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-primary hover:bg-muted"
  );

  if (orientation === "horizontal") {
    return (
      <nav className={cn("flex items-center space-x-1", className)}>
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={linkClasses(route.active)}
          >
            {/* El icono ya tiene su color asignado desde el array `routes` */}
            {route.icon}
            <span>{route.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  // Vertical orientation (para móvil)
  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={mobileLinkClasses(route.active)}
        >
          {/* El icono ya tiene su color asignado desde el array `routes` */}
          {route.icon}
          <span>{route.label}</span>
        </Link>
      ))}
    </nav>
  );
}
