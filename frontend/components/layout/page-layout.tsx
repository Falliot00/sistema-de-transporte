// components/layout/page-layout.tsx
"use client";

import { Header } from "./header";
import { Footer } from "./footer";

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-4 md:py-6">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}