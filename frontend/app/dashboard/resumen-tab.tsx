// components/dashboard/resumen-tab.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlarmsByDayChart } from "./charts/alarms-by-day-chart";
import { AlarmsByTypePieChart } from "./charts/alarms-by-type-pie-chart";
import { AlarmStatusProgressCards } from "./alarm-status-progress-cards";
import { AlarmsByDay, AlarmsByType, AlarmStatusProgress } from "@/types";

// --- INICIO DE LA SOLUCIÓN: Simplificar la prop con el tipo actualizado ---
interface ResumenTabProps {
  alarmsByDayData: AlarmsByDay[];
  alarmsByTypeData: AlarmsByType[]; // Ahora es más simple y directo
  alarmStatusProgressData: AlarmStatusProgress[];
}
// --- FIN DE LA SOLUCIÓN ---

export function ResumenTab({ alarmsByDayData, alarmsByTypeData, alarmStatusProgressData }: ResumenTabProps) {
  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Alarmas por Día</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <AlarmsByDayChart data={alarmsByDayData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribución por Tipo</CardTitle>
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