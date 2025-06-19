// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/tendencias-tab.tsx
"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HourlyDistributionChart } from "./charts/hourly-distribution-chart";
import { WeeklyTrendChart } from "./charts/weekly-trend-chart";
// REMOVIDO: import { getMockHourlyDistribution, getMockWeeklyTrend } from "@/lib/mock-data";

interface TendenciasTabProps {
  alarms: Alarm[]; // Placeholder, specific data fetching/processing might be needed
}

export function TendenciasTab({ alarms }: TendenciasTabProps) {
  // CAMBIO: Datos vacíos para las gráficas.
  const hourlyData = [];
  const weeklyData = [];

  return (
    <div className="space-y-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribución Horaria de Alarmas</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <HourlyDistributionChart data={hourlyData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tendencia Semanal de Alarmas</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <WeeklyTrendChart data={weeklyData} />
        </CardContent>
      </Card>
    </div>
  );
}