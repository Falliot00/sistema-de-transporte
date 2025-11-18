// frontend/app/dashboard/dispositivos-tab.tsx
"use client";

import { useEffect, useState } from "react";
import { Device, DeviceListItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDispositivos } from "@/lib/api";
import { DeviceCard } from "@/components/devices/device-card";
import { Terminal } from "lucide-react";
import { TopDevicesList } from "./top-devices-list";

interface DispositivosTabProps {
  topDevices: Device[];
}

export function DispositivosTab({ topDevices }: DispositivosTabProps) {
  const [allDevices, setAllDevices] = useState<DeviceListItem[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(true);
  const [devicesError, setDevicesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDevices = async () => {
      try {
        setIsLoadingDevices(true);
        const devices = await getDispositivos();
        if (isMounted) {
          setAllDevices(devices);
          setDevicesError(null);
        }
      } catch (error) {
        console.error("Error al cargar los dispositivos para el dashboard:", error);
        if (isMounted) {
          setDevicesError("No se pudieron cargar los dispositivos. Por favor, intente nuevamente más tarde.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDevices(false);
        }
      }
    };

    fetchDevices();
    return () => {
      isMounted = false;
    };
  }, []);

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

      <Card>
        <CardHeader>
          <CardTitle>Todos los Dispositivos</CardTitle>
          <CardDescription>Listado completo de dispositivos registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDevices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`device-skeleton-${index}`} className="h-[180px] w-full rounded-xl" />
              ))}
            </div>
          ) : devicesError ? (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error al cargar dispositivos</AlertTitle>
              <AlertDescription>{devicesError}</AlertDescription>
            </Alert>
          ) : allDevices.length === 0 ? (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Sin dispositivos</AlertTitle>
              <AlertDescription>No se encontraron dispositivos registrados.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allDevices.map((device) => (
                <DeviceCard key={device.idDispositivo} device={device} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
