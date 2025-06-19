// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/dispositivos-tab.tsx
"use client";

import { useState, useEffect } from 'react';
import { Device } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatusSummary } from "./device-status-summary";
import { TopDevicesList } from "./top-devices-list";
// REMOVIDO: import { getMockDeviceStatusSummary, getMockTopDevices } from "@/lib/mock-data";

export function DispositivosTab() {
  // CAMBIO: Inicializar con datos vacíos o 0
  const [statusSummary, setStatusSummary] = useState({
    active: 0,
    maintenance: 0,
    offline: 0,
    total: 0,
  });
  const [topDevices, setTopDevices] = useState<Device[]>([]);

  useEffect(() => {
    // CAMBIO: No cargar datos mock aquí.
    setTopDevices([]);
  }, []);

  return (
    <div className="space-y-6 mt-4">
      <DeviceStatusSummary summary={statusSummary} />
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Dispositivos por Alarmas</CardTitle>
          <CardDescription>Dispositivos con mayor actividad o problemática reciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <TopDevicesList devices={topDevices} />
        </CardContent>
      </Card>
    </div>
  );
}