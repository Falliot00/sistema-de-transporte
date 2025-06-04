"use client"

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { MainNav } from "./main-nav";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
}

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background transition-all duration-300 md:flex",
        !isOpen && "hidden md:flex",
        className
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <span className="text-xl font-bold">Transport App</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <MainNav />
      </div>
    </div>
  );
}