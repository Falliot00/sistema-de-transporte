// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/top-devices-list.tsx
"use client";

import { Device } from "@/types"; // Ensure Device has status, lastActivity, alarmCount, location
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, AlertCircle, MapPin, History } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TopDevicesListProps {
  devices: Device[];
}

const getStatusVariant = (status?: 'active' | 'maintenance' | 'offline'): "success" | "warning" | "destructive" | "default" => {
  if (status === 'active') return 'success';
  if (status === 'maintenance') return 'warning';
  if (status === 'offline') return 'destructive';
  return 'default';
};


export function TopDevicesList({ devices }: TopDevicesListProps) {
  if (!devices || devices.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No hay dispositivos para mostrar.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map(device => (
        <Card key={device.id || device.serialNumber}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md flex items-center">
                <Server className="h-5 w-5 mr-2 text-muted-foreground" />
                {device.name}
              </CardTitle>
              <Badge variant={getStatusVariant(device.status as any)} className="capitalize">
                {device.status || 'Desconocido'}
              </Badge>
            </div>
            <CardDescription>SN: {device.serialNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Alarmas este mes: <span className="font-semibold">{device.alarmCount || 0}</span></span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Ubicación: <span className="font-semibold">{device.location || 'N/A'}</span></span>
            </div>
            <div className="flex items-center">
              <History className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Últ. Actividad: <span className="font-semibold">{device.lastActivity ? formatDate(device.lastActivity) : 'N/A'}</span></span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}