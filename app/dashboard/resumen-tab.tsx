// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/resumen-tab.tsx
"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlarmsByDayChart } from "./charts/alarms-by-day-chart";
import { AlarmsByTypePieChart } from "./charts/alarms-by-type-pie-chart";
import { AlarmStatusProgressCards } from "./alarm-status-progress-cards";
import { getMockAlarmsByDay, getMockAlarmsByType, getMockAlarmStatusProgress } from "@/lib/mock-data";

interface ResumenTabProps {
  alarms: Alarm[]; // Pass all alarms, or pre-filter by date range in parent
}

export function ResumenTab({ alarms }: ResumenTabProps) {
  const alarmsByDayData = getMockAlarmsByDay(); // Uses its own mock for simplicity now
  const alarmsByTypeData = getMockAlarmsByType();
  const alarmStatusProgressData = getMockAlarmStatusProgress(alarms);

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