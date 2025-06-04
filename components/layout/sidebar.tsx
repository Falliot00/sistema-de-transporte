// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/layout/sidebar.tsx
"use client"

import Link from "next/link";
import { Bell, LogOut, UserCircle } from "lucide-react"; // Added LogOut, UserCircle
import { cn } from "@/lib/utils";
import { MainNav } from "./main-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface SidebarProps {
  className?: string;
  isOpen?: boolean; // isOpen might be controlled by PageLayout state
}

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background transition-all duration-300 md:flex",
        !isOpen && "w-0 overflow-hidden opacity-0 md:w-64 md:opacity-100", // Handle open/close for md screens if needed
        className
      )}
    >
      {/* Top Section: Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <span className="text-xl font-bold">Transport App</span>
        </Link>
      </div>

      {/* Middle Section: Navigation - takes up remaining space */}
      <div className="flex-1 overflow-auto py-4">
        <MainNav />
      </div>
      
      {/* Bottom Section: User Profile */}
      <div className="mt-auto border-t p-2"> {/* Added p-2 for some spacing */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2 py-6"> {/* Increased padding */}
              <Avatar className="h-9 w-9 mr-3"> {/* Slightly larger avatar */}
                <AvatarImage src="/avatars/01.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Admin Usuario</span>
                <span className="text-xs text-muted-foreground">admin@example.com</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start"> {/* Opens upwards */}
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notificaciones</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}