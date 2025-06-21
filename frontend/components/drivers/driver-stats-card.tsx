// frontend/components/drivers/driver-stats-card.tsx
"use client";

import { DriverStats } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Clock, CheckCircle, XCircle, AlertTriangle, BarChartHorizontal } from "lucide-react";

interface DriverStatsCardProps {
    stats?: DriverStats;
}

export function DriverStatsCard({ stats }: DriverStatsCardProps) {

    const statItems = [
        { title: "Alarmas Totales", value: stats?.total ?? 0, Icon: Bell, color: "text-foreground" },
        { title: "Pendientes", value: stats?.pending ?? 0, Icon: Clock, color: "text-yellow-500" },
        { title: "Sospechosas", value: stats?.suspicious ?? 0, Icon: AlertTriangle, color: "text-blue-500" },
        { title: "Confirmadas", value: stats?.confirmed ?? 0, Icon: CheckCircle, color: "text-green-500" },
        { title: "Rechazadas", value: stats?.rejected ?? 0, Icon: XCircle, color: "text-red-500" },
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChartHorizontal className="h-6 w-6" />
                    Estadísticas de Alarmas
                </CardTitle>
                <CardDescription>
                    Resumen del historial de alarmas asociadas a este chofer.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {stats?.total === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                        <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="font-semibold">Sin alarmas registradas</p>
                        <p className="text-sm text-muted-foreground">Este chofer no tiene alarmas asociadas en su historial.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {statItems.map(item => (
                            <div key={item.title} className="p-4 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center">
                                <item.Icon className={`h-8 w-8 mb-2 ${item.color}`} />
                                <p className="text-2xl font-bold">{item.value}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.title}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}