// components/layout/sidebar.tsx
"use client"

import Link from "next/link";
import Image from "next/image"; // IMPORTANTE: Añadir import para Image
import { LogOut, UserCircle, Settings, Bell as BellIcon } from "lucide-react"; // Renombrado Bell a BellIcon para evitar conflicto
import { cn } from "@/lib/utils"; //
import { MainNav } from "./main-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  isOpen?: boolean;
}

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background transition-all duration-300 md:flex",
        !isOpen && "w-0 overflow-hidden opacity-0 md:w-64 md:opacity-100", 
        className
      )}
    >
      {/* Top Section: Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          {/* LOGO MODIFICADO */}
          <Image 
            src="/logo-grupo-alliot.png" 
            alt="Grupo Alliot Logo" 
            width={32} // Ajusta según el tamaño deseado
            height={32} // Ajusta según el tamaño deseado
            className="h-8 w-8" // Clases para mantener tamaño si es necesario
          />
          {/* TEXTO MODIFICADO */}
          <span className="text-xl font-semibold">Grupo Alliot</span>
        </Link>
      </div>

      {/* Middle Section: Navigation - takes up remaining space */}
      <div className="flex-1 overflow-auto py-4">
        <MainNav /> {/* */}
      </div>
      
      {/* Bottom Section: User Profile */}
      <div className="mt-auto border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2 py-6">
              <Avatar className="h-9 w-9 mr-3">
               {/* <AvatarImage src="/avatars/01.png" alt="Admin" />*/}
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">Admin Usuario</span>
                <span className="text-xs text-muted-foreground">admin@example.com</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> {/* Usando el icono Settings importado */}
              <span>Configuración</span>
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