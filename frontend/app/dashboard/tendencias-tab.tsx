// app/dashboard/tendencias-tab.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HourlyDistributionChart } from "./charts/hourly-distribution-chart";
import { WeeklyTrendChart } from "./charts/weekly-trend-chart";
import { HourlyDistribution, WeeklyTrend } from "@/types";

// --- INICIO DE LA SOLUCIÓN: El componente ahora recibe los datos como props ---
interface TendenciasTabProps {
  hourlyData: HourlyDistribution[];
  weeklyData: WeeklyTrend[];
}

export function TendenciasTab({ hourlyData, weeklyData }: TendenciasTabProps) {
  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribución Horaria de Alarmas</CardTitle>
          <CardDescription>Picos de actividad de alarmas durante el día en el período seleccionado.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <HourlyDistributionChart data={hourlyData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Semanal de Alarmas</CardTitle>
           <CardDescription>Comparación del volumen de alarmas por día entre la semana actual y la anterior.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <WeeklyTrendChart data={weeklyData} />
        </CardContent>
      </Card>
    </div>
  );
}
// --- FIN DE LA SOLUCIÓN ---