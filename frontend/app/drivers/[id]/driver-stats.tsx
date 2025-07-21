// frontend/app/drivers/[id]/driver-stats.tsx
"use client";

import { DriverStats as DriverStatsType } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bell, Clock, CheckCircle, XCircle, AlertTriangle, BarChartHorizontal } from "lucide-react";

interface DriverStatsProps {
    stats?: DriverStatsType;
}

export function DriverStats({ stats }: DriverStatsProps) {
    const total = stats?.total ?? 0;

    const statItems = [
        { 
            title: "Pendientes", 
            value: stats?.pending ?? 0, 
            Icon: Clock, 
            colorClass: "bg-yellow-500", 
            textColor: "text-yellow-600",
            iconColor: "text-yellow-500"
        },
        { 
            title: "Sospechosas", 
            value: stats?.suspicious ?? 0, 
            Icon: AlertTriangle, 
            colorClass: "bg-blue-500", 
            textColor: "text-blue-600",
            iconColor: "text-blue-500"
        },
        { 
            title: "Confirmadas", 
            value: stats?.confirmed ?? 0, 
            Icon: CheckCircle, 
            colorClass: "bg-green-500", 
            textColor: "text-green-600",
            iconColor: "text-green-500"
        },
        { 
            title: "Rechazadas", 
            value: stats?.rejected ?? 0, 
            Icon: XCircle, 
            colorClass: "bg-red-500", 
            textColor: "text-red-600",
            iconColor: "text-red-500"
        },
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChartHorizontal className="h-6 w-6" />
                    Rendimiento de Alarmas
                </CardTitle>
                <CardDescription>
                    Desglose del historial de alarmas. Total: <span className="font-bold text-foreground">{total}.</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                        <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="font-semibold">Sin alarmas registradas</p>
                        <p className="text-sm text-muted-foreground">Este chofer no tiene alarmas asociadas en su historial.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {statItems.map(item => {
                            const percentage = total > 0 ? (item.value / total) * 100 : 0;
                            return (
                                <div key={item.title} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <item.Icon className={`h-5 w-5 ${item.iconColor}`} />
                                            <span className="font-medium">{item.title}</span>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {item.value} <span className="text-muted-foreground font-normal">({percentage.toFixed(0)}%)</span>
                                        </span>
                                    </div>
                                    <Progress 
                                        value={percentage} 
                                        indicatorClassName={item.colorClass} 
                                        className="h-2" 
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}