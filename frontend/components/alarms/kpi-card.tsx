"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

// --- INICIO DE LA SOLUCIÓN ---
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  iconClassName?: string; // Prop opcional para estilizar el ícono
}

export function KPICard({ title, value, icon, description, iconClassName }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* La clase del ícono ahora es dinámica */}
        <span className={cn("text-muted-foreground", iconClassName)}>{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
// --- FIN DE LA SOLUCIÓN ---