// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/alarm-status-progress-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AlarmStatusProgressData {
  title: string;
  value: number;
  total: number;
  color?: string;
}

interface AlarmStatusProgressCardsProps {
  data: AlarmStatusProgressData[];
}

export function AlarmStatusProgressCards({ data }: AlarmStatusProgressCardsProps) {
  if (!data || data.length === 0) {
    return <div className="text-center text-muted-foreground py-4">No hay datos de progreso disponibles.</div>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data.map((status) => (
        <Card key={status.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{status.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.value} <span className="text-sm font-normal text-muted-foreground">/ {status.total}</span></div>
            <Progress 
              value={(status.value / (status.total || 1)) * 100} 
              className="mt-2 h-3" 
              indicatorClassName={status.color ? `bg-[${status.color}]` : 'bg-primary'} // Custom color needs to be handled carefully. Tailwind JIT might not pick this up. Consider CSS variables.
              style={{ '--indicator-color': status.color } as React.CSSProperties} // Use CSS variable for dynamic color
            />
             <style jsx global>{`
              .progress-indicator-custom {
                background-color: var(--indicator-color) !important;
              }
            `}</style>
            <Progress 
              value={(status.value / (status.total || 1)) * 100} 
              className="mt-2 h-3"
              // For direct style, Recharts uses fill, Progress might need different handling or a custom wrapper
              // This is a simplified approach. For dynamic colors, you might need to define them in tailwind.config or use style attributes.
              // indicatorClassName={status.color ? `bg-[${status.color}]` : 'bg-primary'} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((status.value / (status.total || 1)) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}