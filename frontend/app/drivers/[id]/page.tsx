// frontend/app/drivers/[id]/page.tsx
import { getDriverDetails, getDrivers } from "@/lib/api";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Briefcase, CalendarDays, Contact } from "lucide-react";
import { Driver } from "@/types";

/**
 * Esta función se ejecuta en TIEMPO DE BUILD para generar las rutas estáticas.
 * Es crucial que la API del backend esté disponible durante `npm run build`.
 */
export async function generateStaticParams() {
  try {
    const drivers: Driver[] = await getDrivers();
 
    // Si la API devuelve algo que no es un array, o está vacía, evitamos un error.
    if (!Array.isArray(drivers)) {
        console.warn("⚠️  generateStaticParams no recibió un array de choferes. No se generarán páginas estáticas de choferes.");
        return [];
    }

    return drivers.map((driver) => ({
      id: driver.choferes_id.toString(),
    }));
  } catch (error) {
    // Si la API falla (ej. backend apagado), registramos el error y devolvemos un array vacío
    // para permitir que el build de la aplicación continúe sin romperse.
    console.error("⛔ Error al contactar la API durante generateStaticParams. El build continuará, pero las páginas de choferes no se pre-generarán.", error);
    return [];
  }
}

/**
 * Esta directiva le dice a Next.js que no intente generar páginas para IDs no listados arriba.
 * Si se intenta acceder a /drivers/999, mostrará un 404. Es la configuración correcta para `output: 'export'`.
 */
export const dynamicParams = false;

type DriverDetailPageProps = {
    params: {
        id: string;
    };
};

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

    // Resto del renderizado aquí


    const driverFullName = `${driver.nombre} ${driver.apellido}`;

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
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
            
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary/10">
                    <AvatarImage src={driver.foto || ''} alt={driverFullName} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-secondary">
                        {driver.nombre.charAt(0)}{driver.apellido.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">{driverFullName}</h1>
                    <div className="flex flex-wrap items-center text-muted-foreground text-sm gap-x-4 gap-y-1 mt-1">
                        <InfoRow icon={<Contact className="h-4 w-4" />} value={driver.dni || 'N/A'} />
                        <InfoRow icon={<Briefcase className="h-4 w-4" />} value={driver.empresa || 'N/A'} />
                        <InfoRow icon={<CalendarDays className="h-4 w-4" />} value={driver.anios ? `${driver.anios} años` : 'N/A'} />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1">
                    <DriverStatsCard stats={driver.stats} />
                </div>
                <div className="xl:col-span-2">
                    <RecentAlarmsTable alarms={driver.alarmas || []} />
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, value }: { icon: React.ReactNode, value: string }) {
    return (
        <div className="flex items-center gap-1.5">
            {icon}
            <span>{value}</span>
        </div>
    );
}