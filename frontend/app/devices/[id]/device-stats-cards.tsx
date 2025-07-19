// frontend/app/devices/[id]/device-stats-cards.tsx
"use client";

import { DeviceStats, TopAlarmType } from "@/types";
import { KPICard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, BarChartHorizontal } from 'lucide-react';

interface DeviceStatsCardsProps {
    stats: DeviceStats;
    topAlarmTypes: TopAlarmType[];
}

export function DeviceStatsCards({ stats, topAlarmTypes }: DeviceStatsCardsProps) {
    const mainAlarmType = topAlarmTypes[0]?.name || "N/A";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard 
                title="Total Alarmas Históricas" 
                value={stats.totalAlarms.toLocaleString()} 
                icon={<AlertTriangle />} 
            />
            <KPICard 
                title="Alarmas Confirmadas" 
                value={stats.totalAlarmsConfirmed.toLocaleString()} 
                icon={<CheckCircle />}
                iconClassName="text-green-500"
            />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alarma Más Frecuente</CardTitle>
                    <BarChartHorizontal className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold truncate" title={mainAlarmType}>{mainAlarmType}</p>
                    <p className="text-xs text-muted-foreground">
                        {topAlarmTypes[0] ? `${topAlarmTypes[0].count} ocurrencias` : ''}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}