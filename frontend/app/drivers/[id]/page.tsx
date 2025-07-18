// frontend/app/drivers/[id]/page.tsx
import { getDriverDetails } from "@/lib/api";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DriverStats } from "./driver-stats";
import { RecentAlarmsTable } from "@/components/drivers/recent-alarms-table";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Briefcase, CalendarDays, Contact, Home } from "lucide-react";
import { Driver as DriverType } from "@/types";

export const dynamic = 'force-dynamic';

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let driver: DriverType;
    try {
        driver = await getDriverDetails(id);
    } catch (error: any) {
        if (error.status === 404) {
            notFound();
        }
        console.error("Error al cargar detalles del chofer:", error);
        throw new Error("No se pudieron cargar los detalles del chofer. Por favor, inténtelo de nuevo más tarde.");
    }

    if (!driver) {
      notFound();
    }

    // --- CAMBIO: Usamos el campo unificado ---
    const driverFullName = driver.apellido_nombre || "Chofer sin nombre";
    
    const getInitials = (name: string) => {
        if (!name) return "??";
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6">
            <Breadcrumb>
                {/* ... (código del breadcrumb sin cambios) ... */}
            </Breadcrumb>
            
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                    <AvatarImage src={driver.foto || ''} alt={driverFullName} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                        {getInitials(driverFullName)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    {/* --- CAMBIO: Mostramos el nombre completo --- */}
                    <h1 className="text-4xl font-bold tracking-tight">{driverFullName}</h1>
                    <div className="flex flex-wrap items-center text-muted-foreground text-md gap-x-6 gap-y-1 mt-2">
                        <InfoRow icon={<Contact className="h-4 w-4 text-sky-500" />} value={`DNI: ${driver.dni || 'N/A'}`} />
                        <InfoRow icon={<Briefcase className="h-4 w-4 text-amber-500" />} value={driver.empresa || 'Sin Empresa'} />
                        <InfoRow icon={<CalendarDays className="h-4 w-4 text-violet-500" />} value={driver.anios ? `Legajo: ${driver.anios}` : 'Sin Legajo'} />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <DriverStats stats={driver.stats} />
                </div>
                <div className="lg:col-span-2">
                    <RecentAlarmsTable alarms={driver.alarmas || []} />
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, value }: { icon: React.ReactNode, value: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{value}</span>
        </div>
    );
}