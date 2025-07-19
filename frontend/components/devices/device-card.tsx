// frontend/components/devices/device-card.tsx
"use client";

import { DeviceListItem } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Server, Wifi, BarChart2, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DeviceCardProps {
    device: DeviceListItem;
}

export function DeviceCard({ device }: DeviceCardProps) {
    const hasAlarms = device.totalAlarmas > 0;

    return (
        <Link 
            href={`/devices/${device.idDispositivo}`} 
            className="block group rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <Card className="h-full transition-all duration-200 group-hover:shadow-xl group-hover:border-primary/50 flex flex-col">
                <CardHeader className="flex-row items-center gap-4 space-y-0 pb-2">
                    <div className="p-3 rounded-lg bg-primary/10">
                        <Server className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">
                            Interno {device.nroInterno || 'N/A'}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>Patente: {device.patente || "No disponible"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Wifi className="h-4 w-4" />
                        <span>SIM: {device.sim || "No disponible"}</span>
                    </div>
                </CardContent>
                <CardFooter className={cn(
                    "p-3 text-xs border-t flex justify-between items-center",
                    hasAlarms ? "bg-amber-500/10 text-amber-700" : "bg-green-500/10 text-green-700"
                )}>
                    <div className="flex items-center gap-1.5 font-semibold">
                        <BarChart2 className="h-4 w-4" />
                        <span>{device.totalAlarmas} {device.totalAlarmas === 1 ? 'Alarma' : 'Alarmas'}</span>
                    </div>
                    <Badge variant={hasAlarms ? "warning" : "success"}>
                        {hasAlarms ? "Con Alarmas" : "Sin Alarmas"}
                    </Badge>
                </CardFooter>
            </Card>
        </Link>
    );
}