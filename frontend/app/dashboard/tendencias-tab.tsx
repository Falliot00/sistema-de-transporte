// frontend/app/dashboard/tendencias-tab.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HourlyDistributionChart } from "./charts/hourly-distribution-chart";
// --- REQUERIMIENTO 4: Importamos el gráfico correcto ---
import { AlarmsByDayChart } from "./charts/alarms-by-day-chart";
import { HourlyDistribution, AlarmsByDay } from "@/types";

interface TendenciasTabProps {
  hourlyData: HourlyDistribution[];
  // --- REQUERIMIENTO 4: Cambiamos la prop para recibir los datos por día ---
  alarmsByDayData: AlarmsByDay[];
}

export function TendenciasTab({ hourlyData, alarmsByDayData }: TendenciasTabProps) {
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
      
      {/* --- REQUERIMIENTO 4: Reemplazamos el gráfico anterior --- */}
      <Card>
        <CardHeader>
          <CardTitle>Volumen de Alarmas por Día</CardTitle>
           <CardDescription>Cantidad de alarmas generadas cada día en el período seleccionado.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <AlarmsByDayChart data={alarmsByDayData} />
        </CardContent>
      </Card>
    </div>
  );
}