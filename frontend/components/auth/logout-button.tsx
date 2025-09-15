"use client";

import { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(async () => {
    try {
      setLoading(true);
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      // Redirige al login (full reload para limpiar estado)
      window.location.href = '/login';
    }
  }, []);

  return (
    <Button variant="outline" size="sm" className={className} onClick={onClick} disabled={loading}>
      <LogOut className="h-4 w-4 mr-2" />
      {loading ? 'Saliendo…' : 'Salir'}
    </Button>
  );
}

