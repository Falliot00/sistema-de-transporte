// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/layout/main-nav.tsx
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActivitySquare, Bell, LayoutDashboard, Settings, Users, LineChart } from "lucide-react"; // Added LineChart

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();

  const routes = [
    {
      href: "/",
      label: "Alarmas",
      icon: <Bell className="h-5 w-5 mr-2" />,
      active: pathname === "/",
    },
    {
      //href: "/dashboard",
      href: "/dashboard",
      label: "Dashboard",
      icon: <LineChart className="h-5 w-5 mr-2" />, // Changed icon for Dashboard
      active: pathname === "/dashboard",
    },
    {
      href: "/drivers",
      label: "Choferes",
      icon: <Users className="h-5 w-5 mr-2" />,
      active: pathname === "/drivers",
    },
    {
      href: "/devices",
      label: "Dispositivos",
      icon: <ActivitySquare className="h-5 w-5 mr-2" />,
      active: pathname === "/devices",
    },
    {
      href: "/settings",
      label: "Configuración",
      icon: <Settings className="h-5 w-5 mr-2" />,
      active: pathname === "/settings",
    },
  ];

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
            route.active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-primary hover:bg-muted"
          )}
        >
          {route.icon}
          {route.label}
        </Link>
      ))}
    </nav>
  );
}