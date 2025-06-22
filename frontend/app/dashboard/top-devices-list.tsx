// app/dashboard/top-devices-list.tsx
"use client";

import { Device } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, AlertCircle } from "lucide-react";

interface TopDevicesListProps {
  devices: Device[];
}

export function TopDevicesList({ devices }: TopDevicesListProps) {
  if (!devices || devices.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay datos de dispositivos para mostrar en este período.</p>;
  }

  return (
    <div className="space-y-4">
      {devices.map((device, index) => (
        <Card key={device.id || device.serialNumber}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
            <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted font-bold text-muted-foreground">{index + 1}</span>
                <div>
                    <CardTitle className="text-md flex items-center">
                        {device.name}
                    </CardTitle>
                    <CardDescription>SN: {device.serialNumber}</CardDescription>
                </div>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {device.alarmCount || 0}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}