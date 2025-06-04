// components/dashboard/alarm-status-progress-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AlarmStatusProgressData {
  title: string;
  value: number;
  total: number;
  color?: string; // e.g., "hsl(var(--chart-1))"
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
      {data.map((status) => {
        const percentage = (status.value / (status.total || 1)) * 100;
        return (
          <Card key={status.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{status.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.value} 
                <span className="text-sm font-normal text-muted-foreground"> / {status.total}</span>
              </div>
              <Progress 
                value={percentage} 
                className="mt-2 h-3" 
                style={{ '--indicator-color': status.color } as React.CSSProperties}
                indicatorClassName={status.color ? 'progress-indicator-custom' : ''} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                {percentage.toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>
        );
      })}
      {/* Inline style to apply the custom color variable for progress indicator */}
      <style jsx global>{`
        .progress-indicator-custom {
          background-color: var(--indicator-color) !important;
        }
      `}</style>
    </div>
  );
}