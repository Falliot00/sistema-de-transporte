// app/dashboard/dispositivos-tab.tsx
"use client";

import { Device, DeviceSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatusSummary } from "./device-status-summary";
import { TopDevicesList } from "./top-devices-list";

interface DispositivosTabProps {
  deviceSummary: DeviceSummary;
  topDevices: Device[];
}

export function DispositivosTab({ deviceSummary, topDevices }: DispositivosTabProps) {
  return (
    <div className="space-y-6 mt-4">
      <DeviceStatusSummary summary={deviceSummary} />
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Dispositivos por Alarmas</CardTitle>
          <CardDescription>Dispositivos con mayor actividad de alarmas en el período seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <TopDevicesList devices={topDevices} />
        </CardContent>
      </Card>
    </div>
  );
}