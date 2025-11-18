// frontend/app/dashboard/top-devices-list.tsx
"use client";

import { Device } from "@/types";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface TopDevicesListProps {
  devices: Device[];
}

export function TopDevicesList({ devices }: TopDevicesListProps) {
  if (!devices || devices.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay dispositivos con alarmas en este período.</p>;
  }

  return (
    <div className="space-y-4">
      {devices.map((device, index) => (
        <Link
          key={device.id || device.serialNumber}
          href={`/devices/${device.id}`}
          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
              <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted font-bold text-muted-foreground">{index + 1}</span>
                  <div>
                      {/* --- REQUERIMIENTO 8: `name` ahora es el Interno --- */}
                      <CardTitle className="text-md flex items-center">
                          {device.name}
                      </CardTitle>
                      {/* --- REQUERIMIENTO 8: `serialNumber` ahora es la Patente --- */}
                      <CardDescription>Patente: {device.serialNumber}</CardDescription>
                  </div>
              </div>
              <div className="flex items-center gap-2 text-lg font-bold">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  {device.alarmCount || 0}
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
