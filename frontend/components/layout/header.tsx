// components/layout/header.tsx
import Link from "next/link";
import Image from "next/image";
import { Menu, LogOut, UserCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MainNav } from "./main-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="h-16 px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <Image 
              src="/logo-grupo-alliot.png" 
              alt="Grupo Alliot Logo" 
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span>Grupo Alliot</span>
          </Link>
          
          {/* Navegación principal centrada - visible en desktop */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <MainNav orientation="horizontal" />
          </div>
          
          {/* Sección derecha con perfil de usuario */}
          <div className="flex items-center gap-4">
            {/* Menu móvil */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex h-16 items-center border-b px-4">
                  <Link 
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                  >
                    <Image 
                      src="/logo-grupo-alliot.png" 
                      alt="Grupo Alliot Logo" 
                      width={28}
                      height={28}
                      className="h-7 w-7"
                    />
                    <span>Grupo Alliot</span>
                  </Link>
                </div>
                <div className="p-4">
                  <MainNav orientation="vertical" />
                </div>
              </SheetContent>
            </Sheet>
            
            <LogoutButton />
            {/* Dropdown de usuario */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium">Admin Usuario</span>
                    <span className="text-xs text-muted-foreground">admin@example.com</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>
      </div>
    </header>
  );
}
