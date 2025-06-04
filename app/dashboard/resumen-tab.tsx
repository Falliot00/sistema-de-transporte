// components/dashboard/resumen-tab.tsx
"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlarmsByDayChart } from "./charts/alarms-by-day-chart";
import { AlarmsByTypePieChart } from "./charts/alarms-by-type-pie-chart";
import { AlarmStatusProgressCards } from "./alarm-status-progress-cards"; // Corrected path
import { getMockAlarmsByDay, getMockAlarmsByType, getMockAlarmStatusProgress } from "@/lib/mock-data";

interface ResumenTabProps {
  alarms: Alarm[];
}

export function ResumenTab({ alarms }: ResumenTabProps) {
  // These mock data functions might eventually take 'alarms' or date range as parameters
  const alarmsByDayData = getMockAlarmsByDay(); 
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