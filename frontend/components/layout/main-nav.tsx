// components/layout/main-nav.tsx
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActivitySquare, Bell, LayoutDashboard, Settings, Users, LineChart } from "lucide-react";

interface MainNavProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function MainNav({ className, orientation = "vertical" }: MainNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      href: "/",
      label: "Alarmas",
      icon: <Bell className="h-5 w-5" />,
      active: pathname === "/",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LineChart className="h-5 w-5" />,
      active: pathname.startsWith("/dashboard"),
    },
    {
      href: "/drivers",
      label: "Choferes",
      icon: <Users className="h-5 w-5" />,
      active: pathname.startsWith("/drivers"),
    },
    {
      href: "/devices",
      label: "Dispositivos",
      icon: <ActivitySquare className="h-5 w-5" />,
      active: pathname.startsWith("/devices"),
    },
    {
      href: "/settings",
      label: "Configuración",
      icon: <Settings className="h-5 w-5" />,
      active: pathname.startsWith("/settings"),
    },
  ];

  if (orientation === "horizontal") {
    return (
      <nav className={cn("flex items-center space-x-1", className)}>
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              route.active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-primary hover:bg-muted"
            )}
          >
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
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            route.active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary hover:bg-muted"
          )}
        >
          {route.icon}
          <span>{route.label}</span>
        </Link>
      ))}
    </nav>
  );
}