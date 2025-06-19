// components/dashboard/resumen-tab.tsx
"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlarmsByDayChart } from "./charts/alarms-by-day-chart";
import { AlarmsByTypePieChart } from "./charts/alarms-by-type-pie-chart";
import { AlarmStatusProgressCards } from "./alarm-status-progress-cards";
// REMOVIDO: import { getMockAlarmsByDay, getMockAlarmsByType, getMockAlarmStatusProgress } from "@/lib/mock-data";

interface ResumenTabProps {
  alarms: Alarm[]; // Todavía se pasa alarms, aunque vacío por ahora
}

export function ResumenTab({ alarms }: ResumenTabProps) {
  // CAMBIO: Datos vacíos para las gráficas.
  // En un sistema real, estas funciones procesarían 'alarms' o harían sus propias fetches.
  const alarmsByDayData = []; 
  const alarmsByTypeData = [];
  const alarmStatusProgressData = []; 

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Alarmas por Día (Últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <AlarmsByDayChart data={alarmsByDayData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribución de Alarmas por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <AlarmsByTypePieChart data={alarmsByTypeData} />
          </CardContent>
        </Card>
      </div>
      <AlarmStatusProgressCards data={alarmStatusProgressData} />
    </div>
  );
}