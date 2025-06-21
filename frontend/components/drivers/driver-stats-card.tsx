// frontend/components/drivers/driver-stats-card.tsx
"use client";

import { DriverStats } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Importamos nuestro componente mejorado
import { Bell, Clock, CheckCircle, XCircle, AlertTriangle, BarChartHorizontal } from "lucide-react";

interface DriverStatsCardProps {
    stats?: DriverStats;
}

export function DriverStatsCard({ stats }: DriverStatsCardProps) {

    const total = stats?.total ?? 0;

    const statItems = [
        { title: "Pendientes", value: stats?.pending ?? 0, Icon: Clock, colorClass: "bg-yellow-500", textColor: "text-yellow-500" },
        { title: "Sospechosas", value: stats?.suspicious ?? 0, Icon: AlertTriangle, colorClass: "bg-blue-500", textColor: "text-blue-500" },
        { title: "Confirmadas", value: stats?.confirmed ?? 0, Icon: CheckCircle, colorClass: "bg-green-500", textColor: "text-green-500" },
        { title: "Rechazadas", value: stats?.rejected ?? 0, Icon: XCircle, colorClass: "bg-red-500", textColor: "text-red-500" },
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChartHorizontal className="h-6 w-6" />
                    Rendimiento de Alarmas
                </CardTitle>
                <CardDescription>
                    Desglose del historial de alarmas del chofer. Total: <span className="font-bold text-foreground">{total}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg h-48">
                        <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="font-semibold">Sin alarmas registradas</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {statItems.map(item => {
                            const percentage = total > 0 ? (item.value / total) * 100 : 0;
                            return (
                                <div key={item.title}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <div className="flex items-center gap-2 font-medium">
                                            <item.Icon className={`h-4 w-4 ${item.textColor}`} />
                                            <span>{item.title}</span>
                                        </div>
                                        <span className="font-semibold">{item.value} <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span></span>
                                    </div>
                                    {/* SOLUCIÓN: Ahora pasamos la clase de color a la prop correcta `indicatorClassName` */}
                                    <Progress value={percentage} indicatorClassName={item.colorClass} className="h-2" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}