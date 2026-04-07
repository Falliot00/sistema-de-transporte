// frontend/app/drivers/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getDrivers } from "@/lib/api";
import { Driver } from '@/types';
import { DriverCard } from "@/components/drivers/driver-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
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

    const handleClearFilters = () => {
        setCompanyFilters([]);
        setSearchTerm("");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Plantel de Choferes</h1>
                    <p className="text-muted-foreground">
                        Busca, visualiza y gestiona la información de los choferes del sistema.
                    </p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                    Total de choferes:{' '}
                    <span className="text-foreground">{isLoading ? "Cargando..." : allDrivers.length}</span>
                </p>
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
