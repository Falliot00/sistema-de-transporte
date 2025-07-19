// frontend/app/devices/[id]/page.tsx
import { getDispositivoDetails } from "@/lib/api";
import { notFound } from "next/navigation";
import { DeviceDetails as DeviceDetailsType } from "@/types";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, Server, Hash, Wifi } from "lucide-react";
import { DeviceStatsCards } from "./device-stats-cards";
import { AlarmsByWeekdayChart } from "./alarms-by-weekday-chart";

export const dynamic = 'force-dynamic';

function InfoRow({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let device: DeviceDetailsType;
    try {
        device = await getDispositivoDetails(id);
    } catch (error: any) {
        if (error.status === 404) notFound();
        console.error("Error al cargar detalles del dispositivo:", error);
        throw new Error("No se pudieron cargar los detalles del dispositivo.");
    }

    if (!device) notFound();

    const deviceName = `Interno ${device.nroInterno || device.idDispositivo}`;

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/" className="flex items-center gap-1"><Home className="h-4 w-4"/> Home</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbLink href="/devices">Dispositivos</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>{deviceName}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center gap-6">
                <div className="p-4 rounded-full bg-primary/10 border">
                    <Server className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">{deviceName}</h1>
                    <div className="flex flex-wrap items-center text-md gap-x-6 gap-y-1 mt-2">
                        <InfoRow icon={<Hash className="h-4 w-4 text-sky-500" />} label="Patente" value={device.patente || 'N/A'} />
                        <InfoRow icon={<Wifi className="h-4 w-4 text-amber-500" />} label="SIM" value={device.sim || 'N/A'} />
                        <InfoRow icon={<Server className="h-4 w-4 text-violet-500" />} label="ID Dispositivo" value={device.idDispositivo} />
                    </div>
                </div>
            </div>
            
            <DeviceStatsCards stats={device.stats} topAlarmTypes={device.topAlarmTypes} />

            <div className="grid grid-cols-1">
                <AlarmsByWeekdayChart data={device.stats.alarmsByWeekday} />
            </div>
        </div>
    );
}