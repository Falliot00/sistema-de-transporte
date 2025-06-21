// frontend/app/drivers/page.tsx
import { getDrivers } from "@/lib/api";
import { DriverCard } from "@/components/drivers/driver-card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default async function DriversPage() {
    const drivers = await getDrivers();

    return (
        <div className="space-y-6">
            <div>
                <Breadcrumb className="mb-4">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Choferes</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl font-bold">Plantel de Choferes</h1>
                <p className="text-muted-foreground">
                    Visualiza y gestiona la información y estadísticas de los choferes.
                </p>
            </div>

            {drivers && drivers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {drivers.map((driver) => (
                        <DriverCard key={driver.choferes_id} driver={driver} />
                    ))}
                </div>
            ) : (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>No se encontraron choferes</AlertTitle>
                    <AlertDescription>
                        Actualmente no hay choferes registrados en la base de datos.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}