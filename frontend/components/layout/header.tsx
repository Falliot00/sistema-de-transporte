// components/layout/header.tsx
import Link from "next/link";
import Image from "next/image"; // IMPORTANTE: Añadir import para Image
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MainNav } from "./main-nav"; //

interface HeaderProps {
  toggleSidebar?: () => void; 
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleSidebar} 
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-16 items-center border-b px-4">
                 <Link 
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  {/* LOGO MODIFICADO (SHEET) */}
                  <Image 
                    src="/logo-grupo-alliot.png" 
                    alt="Grupo Alliot Logo" 
                    width={28} // Ajusta según el tamaño deseado
                    height={28} // Ajusta según el tamaño deseado
                    className="h-7 w-7"
                  />
                  {/* TEXTO MODIFICADO (SHEET) */}
                  <span>Grupo Alliot</span>
                </Link>
              </div>
              <div className="p-4">
                <MainNav />
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Logo/Título para MD y mayores, si el sidebar no está siempre visible o para branding extra */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-2 text-xl font-bold"
          >
            {/* LOGO MODIFICADO (MD screens) */}
             <Image 
                src="/logo-grupo-alliot.png" 
                alt="Grupo Alliot Logo" 
                width={32}
                height={32}
                className="h-8 w-8"
              />
            {/* TEXTO MODIFICADO (MD screens) */}
            <span className="hidden md:inline-block">Grupo Alliot</span>
          </Link>
        </div>
        
        {/* Aquí irían otros elementos del header si los hubiera, como el perfil de usuario si no estuviera en el sidebar */}
        
      </div>
    </header>
  );
}