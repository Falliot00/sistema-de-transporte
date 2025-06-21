// frontend/app/drivers/[id]/driver-stats.tsx
"use client";

import { DriverStats as DriverStatsType } from "@/types"; // Importamos el tipo correcto y le damos un alias
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Clock, CheckCircle, XCircle, AlertTriangle, BarChartHorizontal } from "lucide-react";

interface DriverStatsProps {
    stats?: DriverStatsType; // La propiedad que recibe el componente se llama 'stats'
}

// El componente se exporta como DriverStats para ser usado en la página.
export function DriverStats({ stats }: DriverStatsProps) {

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
                {/* Lógica para mostrar las estadísticas o un mensaje si no hay alarmas */}
                {!stats || stats.total === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                        <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="font-semibold">Sin alarmas registradas</p>
                        <p className="text-sm text-muted-foreground">Este chofer no tiene alarmas asociadas en su historial.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {statItems.map(item => (
                            <div key={item.title} className="p-4 bg-background border rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
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