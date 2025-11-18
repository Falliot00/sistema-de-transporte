// frontend/app/dashboard/dispositivos-tab.tsx
"use client";

import { Device } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopDevicesList } from "./top-devices-list";

interface DispositivosTabProps {
  topDevices: Device[];
}

export function DispositivosTab({ topDevices }: DispositivosTabProps) {
  return (
    <div className="space-y-6 mt-4">
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
