// frontend/app/dashboard/dispositivos-tab.tsx
"use client";

import { Device } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// --- REQUERIMIENTO 7: Eliminamos la importación ---
// import { DeviceStatusSummary } from "./device-status-summary";
import { TopDevicesList } from "./top-devices-list";

interface DispositivosTabProps {
  // --- REQUERIMIENTO 7: Eliminamos la prop `deviceSummary` ---
  topDevices: Device[];
}

export function DispositivosTab({ topDevices }: DispositivosTabProps) {
  return (
    <div className="space-y-6 mt-4">
      {/* --- REQUERIMIENTO 7: Eliminamos el componente --- */}
      {/* <DeviceStatusSummary summary={deviceSummary} /> */}
      
      <Card>
        <CardHeader>
          <CardTitle>Top Dispositivos por Alarmas</CardTitle>
          <CardDescription>Dispositivos con mayor actividad de alarmas en el período seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <TopDevicesList devices={topDevices} />
        </CardContent>
      </Card>
    </div>
  );
}