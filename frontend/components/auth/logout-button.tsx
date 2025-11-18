"use client";

import { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const AUTHENTIK_LOGOUT_URL = process.env.NEXT_PUBLIC_AUTHENTIK_LOGOUT_URL;

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(async () => {
    try {
      setLoading(true);
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      // Redirige al logout del proveedor SSO (o al inicio si no está configurado)
      window.location.href = AUTHENTIK_LOGOUT_URL || '/';
    }
  }, []);

  return (
    <Button variant="outline" size="sm" className={className} onClick={onClick} disabled={loading}>
      <LogOut className="h-4 w-4 mr-2" />
      {loading ? 'Saliendo…' : 'Salir'}
    </Button>
  );
}

