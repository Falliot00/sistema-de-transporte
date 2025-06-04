// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/device-status-summary.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Server } from "lucide-react";

interface DeviceStatusSummaryProps {
  summary: {
    active: number;
    maintenance: number;
    offline: number;
    total: number;
  };
}

export function DeviceStatusSummary({ summary }: DeviceStatusSummaryProps) {
  const statusItems = [
    { title: "Activos", value: summary.active, Icon: CheckCircle, color: "text-green-500" },
    { title: "En Mantenimiento", value: summary.maintenance, Icon: AlertTriangle, color: "text-yellow-500" },
    { title: "Offline", value: summary.offline, Icon: XCircle, color: "text-red-500" },
    { title: "Total Dispositivos", value: summary.total, Icon: Server, color: "text-blue-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statusItems.map(item => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.Icon className={`h-5 w-5 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            {item.title !== "Total Dispositivos" && (
              <p className="text-xs text-muted-foreground">
                {((item.value / (summary.total || 1)) * 100).toFixed(1)}% del total
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}