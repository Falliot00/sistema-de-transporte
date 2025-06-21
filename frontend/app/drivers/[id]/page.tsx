// frontend/app/drivers/[id]/page.tsx
import { getDriverDetails, getDrivers } from "@/lib/api"; // Importamos también getDrivers
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DriverStats } from "./driver-stats"; // Asumo que el componente está en el mismo directorio
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Briefcase, CalendarDays, Contact } from "lucide-react";

// --- INICIO DE LA SOLUCIÓN ---
// Esta función es requerida por Next.js en modo 'output: export'
// para generar páginas estáticas para cada ruta dinámica.
export async function generateStaticParams() {
  try {
    // 1. Obtenemos todos los choferes desde la API.
    const drivers = await getDrivers();
 
    // 2. Mapeamos la lista de choferes a un array de objetos
    //    con el formato que Next.js espera: [{ id: '1' }, { id: '2' }, ...]
    return drivers.map((driver) => ({
      id: driver.choferes_id.toString(),
    }));
  } catch (error) {
    console.error("Error al generar params estáticos para choferes:", error);
    // Si la API falla, devolvemos un array vacío para evitar que el build se rompa.
    return [];
  }
}
// --- FIN DE LA SOLUCIÓN ---


type DriverDetailPageProps = {
    params: {
        id: string;
    };
};

export default async function DriverDetailPage({ params }: DriverDetailPageProps) {
    let driver;
    try {
        driver = await getDriverDetails(params.id);
    } catch (error: any) {
        if ((error as any).status === 404) {
            notFound();
        }
        // Para otros errores, los dejamos pasar para que Next.js los muestre.
        throw error;
    }

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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20">
                                    <AvatarImage src={driver.foto || ''} alt={driverFullName} className="object-cover" />
                                    <AvatarFallback className="text-4xl">
                                        {driver.nombre.charAt(0)}{driver.apellido.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-2xl">{driverFullName}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoRow icon={<Contact className="h-5 w-5" />} label="DNI" value={driver.dni || 'No especificado'} />
                            <InfoRow icon={<Briefcase className="h-5 w-5" />} label="Empresa" value={driver.empresa || 'No especificada'} />
                            <InfoRow icon={<CalendarDays className="h-5 w-5" />} label="Años" value={driver.anios ? `${driver.anios} años` : 'No especificado'} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <DriverStats stats={driver.stats} />
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center text-sm">
            <div className="text-muted-foreground mr-3">{icon}</div>
            <span className="font-semibold mr-2">{label}:</span>
            <span className="text-muted-foreground">{value}</span>
        </div>
    );
}