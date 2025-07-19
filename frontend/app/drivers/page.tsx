// frontend/app/drivers/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDrivers } from "@/lib/api";
import { Driver } from '@/types';
import { DriverCard } from "@/components/drivers/driver-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Terminal, Users, Building, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/shared/kpi-card';
//import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AdvancedFilters } from '@/components/shared/advanced-filters';

// Hook de debounce para la búsqueda
function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const KPICardSkeleton = () => (
    <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-7 w-12" />
    </div>
);

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];

export default function DriversPage() {
    const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [companyFilters, setCompanyFilters] = useState<string[]>([]);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const loadDrivers = useCallback(async () => {
        try {
            setIsLoading(true);
            const drivers = await getDrivers({ 
                search: debouncedSearchTerm, 
                company: companyFilters 
            });
            setAllDrivers(drivers);
        } catch (err) {
            setError("No se pudieron cargar los datos de los choferes.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, companyFilters]);

    useEffect(() => {
        loadDrivers();
    }, [loadDrivers]);

    const kpis = useMemo(() => {
        // Los KPIs ahora se basan en la lista filtrada `allDrivers`
        const totalDrivers = allDrivers.length;
        const companyCounts = allDrivers.reduce((acc, driver) => {
            if (driver.empresa) {
                acc[driver.empresa] = (acc[driver.empresa] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const mainCompany = Object.keys(companyCounts).length > 0
            ? Object.entries(companyCounts).sort((a, b) => b[1] - a[1])[0][0]
            : "N/A";
        
        return { totalDrivers, mainCompany };
    }, [allDrivers]);
    
    const handleClearFilters = () => {
        setCompanyFilters([]);
        setSearchTerm("");
    };
    
    return (
        <div className="space-y-6">
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
                        <KPICard title="Total de Choferes" value={kpis.totalDrivers} icon={<Users className="h-5 w-5" />} iconClassName="text-blue-500" />
                        <KPICard title="Empresa Principal" value={kpis.mainCompany} icon={<Building className="h-5 w-5" />} iconClassName="text-green-500" />
                        <KPICard title="Actividad General" value="Normal" icon={<BarChart2 className="h-5 w-5" />} iconClassName="text-orange-500" />
                    </>
                )}
            </div>
            <div className="space-y-4 p-4 border bg-card rounded-lg">
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="relative w-full flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            type="search"
                            placeholder="Buscar por nombre, DNI..." 
                            className="pl-10 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <AdvancedFilters
                        onClear={handleClearFilters}
                        disabled={isLoading}
                        filterSections={[
                            {
                                title: 'Por Empresa',
                                items: AVAILABLE_COMPANIES,
                                selectedItems: companyFilters,
                                onSelectionChange: setCompanyFilters
                            }
                        ]}
                    />
                </div>
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
            ) : allDrivers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {allDrivers.map((driver) => (
                        <DriverCard key={driver.choferes_id} driver={driver} />
                    ))}
                </div>
            ) : (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>No se encontraron resultados</AlertTitle>
                    <AlertDescription>
                        No hay choferes que coincidan con los filtros aplicados.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}