// frontend/app/devices/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDispositivos } from "@/lib/api";
import { DeviceListItem } from '@/types';
import { DeviceCard } from "@/components/devices/device-card";
import { KPICard } from '@/components/shared/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
//import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Server, Search, BarChartBig, WifiOff, Terminal } from "lucide-react";

// Hook de debounce para no sobrecargar la API con cada letra que se escribe
function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const KPICardSkeleton = () => (
    <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-7 w-12" />
    </div>
);

export default function DevicesPage() {
    const [allDevices, setAllDevices] = useState<DeviceListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Usamos el valor "debounced" para hacer la llamada a la API
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const loadDevices = useCallback(async () => {
        try {
            setIsLoading(true);
            const devices = await getDispositivos({ search: debouncedSearchTerm });
            setAllDevices(devices);
        } catch (err) {
            setError("No se pudieron cargar los datos de los dispositivos. Por favor, intente de nuevo más tarde.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);
    
    // Los KPIs se calculan en el frontend a partir de la lista completa (antes del filtro de búsqueda local)
    // Para KPIs filtrados, se necesitaría un endpoint de agregación en el backend.
    const kpis = useMemo(() => {
        const totalDevices = allDevices.length;
        const totalAlarms = allDevices.reduce((sum, device) => sum + device.totalAlarmas, 0);
        const devicesWithoutSim = allDevices.filter(d => !d.sim).length;
        return { totalDevices, totalAlarms, devicesWithoutSim };
    }, [allDevices]);

    // El filtrado por búsqueda se hace en el cliente para una respuesta instantánea
    // mientras el usuario escribe, pero la llamada a la API es debounced.
    const filteredDevices = useMemo(() => {
        if (!searchTerm) {
            return allDevices;
        }
        const lowercasedSearch = searchTerm.toLowerCase();
        return allDevices.filter(device =>
            device.patente?.toLowerCase().includes(lowercasedSearch) ||
            device.nroInterno?.toString().includes(lowercasedSearch)
        );
    }, [searchTerm, allDevices]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Panel de Dispositivos</h1>
                <p className="text-muted-foreground">
                    Busca, visualiza y analice el estado y rendimiento de los dispositivos instalados.
                </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading && allDevices.length === 0 ? (
                    <>
                        <KPICardSkeleton />
                        <KPICardSkeleton />
                        <KPICardSkeleton />
                    </>
                ) : (
                    <>
                        <KPICard title="Total de Dispositivos" value={kpis.totalDevices} icon={<Server className="h-5 w-5" />} iconClassName="text-orange-500" />
                        <KPICard title="Total de Alarmas" value={kpis.totalAlarms.toLocaleString()} icon={<BarChartBig className="h-5 w-5" />} description="Suma de todas las alarmas históricas." iconClassName="text-indigo-500" />
                        <KPICard title="Dispositivos sin SIM" value={kpis.devicesWithoutSim} icon={<WifiOff className="h-5 w-5" />} iconClassName={kpis.devicesWithoutSim > 0 ? "text-destructive" : "text-green-500"} />
                    </>
                )}
            </div>
            <div className="space-y-4 p-4 border bg-card rounded-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        type="search"
                        placeholder="Buscar por interno o patente..." 
                        className="pl-10 h-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoading && allDevices.length === 0}
                    />
                </div>
            </div>
            {isLoading && allDevices.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                     {Array.from({ length: 15 }).map((_, i) => (
                        <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
                    ))}
                </div>
            ) : error ? (
                 <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error de Conexión</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : filteredDevices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredDevices.map((device) => (
                        <DeviceCard key={device.idDispositivo} device={device} />
                    ))}
                </div>
            ) : (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>No se encontraron resultados</AlertTitle>
                    <AlertDescription>
                        No hay dispositivos que coincidan con la búsqueda.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}