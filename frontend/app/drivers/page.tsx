"use client";

import { useState, useEffect, useMemo } from 'react';
import { getDrivers } from "@/lib/api";
import { Driver } from '@/types';
import { DriverCard } from "@/components/drivers/driver-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Terminal, Users, Building, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/shared/kpi-card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";


// Componente Skeleton específico para las tarjetas de KPIs
const KPICardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-7 w-12" />
        </CardContent>
    </Card>
);

export default function DriversPage() {
    const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadDrivers = async () => {
            try {
                setIsLoading(true);
                const drivers = await getDrivers();
                setAllDrivers(drivers);
            } catch (err) {
                setError("No se pudieron cargar los datos de los choferes. Asegúrate de que el servidor backend esté funcionando correctamente.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadDrivers();
    }, []);

    // Lógica de filtrado en el lado del cliente para una respuesta instantánea.
    const filteredDrivers = useMemo(() => {
        if (!searchTerm) {
            return allDrivers;
        }
        return allDrivers.filter(driver =>
            driver.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allDrivers]);

    // KPIs calculados en el cliente después de obtener todos los datos.
    const totalDrivers = allDrivers.length;
    const companyCounts = useMemo(() => allDrivers.reduce((acc, driver) => {
        if (driver.empresa) {
            acc[driver.empresa] = (acc[driver.empresa] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>), [allDrivers]);

    const mainCompany = useMemo(() => Object.keys(companyCounts).length > 0
        ? Object.entries(companyCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "N/A", [companyCounts]);
    
    return (
        <div className="space-y-6">
            {/*
             <Breadcrumb>
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
            */}
            <div>
                <h1 className="text-3xl font-bold">Plantel de Choferes</h1>
                <p className="text-muted-foreground">
                    Busca, visualiza y gestiona la información de los choferes del sistema.
                </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <>
                        <KPICardSkeleton />
                        <KPICardSkeleton />
                        <KPICardSkeleton />
                    </>
                ) : (
                    <>
                        <KPICard 
                            title="Total de Choferes" 
                            value={totalDrivers} 
                            icon={<Users className="h-5 w-5" />} 
                            iconClassName="text-blue-500"
                        />
                        <KPICard 
                            title="Empresa Principal" 
                            value={mainCompany} 
                            icon={<Building className="h-5 w-5" />}
                            iconClassName="text-green-500"
                        />
                         <KPICard 
                            title="Actividad General" 
                            value="Normal"
                            icon={<BarChart2 className="h-5 w-5" />}
                            iconClassName="text-orange-500"
                        />
                    </>
                )}
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    type="search"
                    placeholder="Buscar por nombre, DNI, empresa..." 
                    className="pl-10 h-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                     {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Conexión</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : filteredDrivers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredDrivers.map((driver) => (
                        <DriverCard key={driver.choferes_id} driver={driver} />
                    ))}
                </div>
            ) : (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>No se encontraron resultados</AlertTitle>
                    <AlertDescription>
                        {searchTerm ? `No hay choferes que coincidan con tu búsqueda "${searchTerm}".` : "No hay choferes registrados en el sistema."}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}