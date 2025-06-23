import { getDriverDetails, getDrivers } from "@/lib/api";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DriverStatsCard } from "@/components/drivers/driver-stats-card";
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
import { Driver } from "@/types";

export const dynamic = 'force-dynamic';

/*export async function generateStaticParams() {
  try {
    const drivers: Driver[] = await getDrivers();
    if (!Array.isArray(drivers)) {
        console.warn("⚠️  generateStaticParams no recibió un array de choferes. No se generarán páginas estáticas.");
        return [];
    }
    return drivers.map((driver) => ({
      id: driver.choferes_id.toString(),
    }));
  } catch (error) {
    console.error("⛔ Error al contactar la API durante generateStaticParams. El build continuará, pero las páginas de choferes no se pre-generarán.", error);
    return [];
  }
}
export const dynamicParams = false;*/

// Este componente ahora se ejecuta para cada ID durante el `build`.
export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let driver;
    try {
        // La llamada a la API también se hace en tiempo de build para cada página.
        driver = await getDriverDetails(id);
    } catch (error: any) {
        // Si por alguna razón un ID específico falla, mostramos notFound().
        if ((error as any).status === 404) {
            notFound();
        }
        // Para otros errores, los dejamos pasar para que el build falle y nos alerte.
        throw error;
    }

    const driverFullName = `${driver.nombre} ${driver.apellido}`;

    return (
        <div className="space-y-6">
            
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="flex items-center gap-1"><Home className="h-4 w-4"/> Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/drivers">Choferes</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{driverFullName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                    <AvatarImage src={driver.foto || ''} alt={driverFullName} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                        {driver.nombre.charAt(0)}{driver.apellido.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">{driverFullName}</h1>
                    <div className="flex flex-wrap items-center text-muted-foreground text-md gap-x-6 gap-y-1 mt-2">
                        <InfoRow icon={<Contact className="h-4 w-4 text-sky-500" />} value={driver.dni || 'No disponible'} />
                        <InfoRow icon={<Briefcase className="h-4 w-4 text-amber-500" />} value={driver.empresa || 'No disponible'} />
                        <InfoRow icon={<CalendarDays className="h-4 w-4 text-violet-500" />} value={driver.anios ? `${driver.anios} años` : 'No disponible'} />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <DriverStatsCard stats={driver.stats} />
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