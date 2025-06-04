// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/layout/header.tsx
import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MainNav } from "./main-nav";
// Removed Avatar and DropdownMenu as user profile will be in Sidebar
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


interface HeaderProps {
  toggleSidebar?: () => void; // This prop might not be needed if sidebar toggle is handled by Sheet
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
                className="md:hidden" // Only show on mobile/tablet
                onClick={toggleSidebar} // Retain toggle if it has other effects
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0"> {/* Adjusted padding */}
              <div className="flex h-16 items-center border-b px-4">
                 <Link 
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold" // Adjusted size
                >
                  <Bell className="h-6 w-6" />
                  <span>Transport App</span>
                </Link>
              </div>
              <div className="p-4"> {/* Added padding for Nav */}
                <MainNav />
              </div>
            </SheetContent>
          </Sheet>
          {/* Logo/Title for larger screens - already part of Sidebar, but can be here for consistency if sidebar is collapsible */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-2 text-xl font-bold"
          >
            <Bell className="h-6 w-6" />
            <span>Transport App</span>
          </Link>
        </div>
        
        {/* User profile section removed from here, will be added to Sidebar */}
        {/* <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="@admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Facturación</DropdownMenuItem>
                <DropdownMenuItem>Configuración</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> */}
      </div>
    </header>
  );
}