// frontend/app/drivers/[id]/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getDriverDetails } from "@/lib/api";
import { useParams, notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DriverStats } from "./driver-stats";
import { RecentAlarmsTable } from "@/components/drivers/recent-alarms-table";
import { Briefcase, CalendarDays, Contact, Home } from "lucide-react";
import { Driver as DriverType, Alarm } from "@/types";
import { AdvancedFilters } from '@/components/shared/advanced-filters';
import { DateRange } from 'react-day-picker';
import { alarmTypes } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,} from "@/components/ui/breadcrumb";

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];

export default function DriverDetailPage() {
    const params = useParams();
    const id = params.id as string;
    
    const [driver, setDriver] = useState<DriverType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados de filtros
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [companyFilters, setCompanyFilters] = useState<string[]>([]);

    useEffect(() => {
        const loadDriver = async () => {
            try {
                setIsLoading(true);
                const data = await getDriverDetails(id);
                setDriver(data);
            } catch (error: any) {
                if (error.status === 404) {
                    notFound();
                }
                setError("No se pudieron cargar los detalles del chofer.");
            } finally {
                setIsLoading(false);
            }
        };
        
        loadDriver();
    }, [id]);

    // Filtrar alarmas basándose en los filtros seleccionados
    const filteredAlarms = useMemo(() => {
        if (!driver?.alarmas) return [];
        
        return driver.alarmas.filter(alarm => {
            // Filtro por rango de fechas
            if (dateRange?.from || dateRange?.to) {
                const alarmDate = new Date(alarm.timestamp);
                if (dateRange.from && alarmDate < dateRange.from) return false;
                if (dateRange.to) {
                    const endOfDay = new Date(dateRange.to);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (alarmDate > endOfDay) return false;
                }
            }
            
            // Filtro por tipo de alarma
            if (typeFilters.length > 0 && !typeFilters.includes(alarm.type)) {
                return false;
            }
            
            // Filtro por empresa
            if (companyFilters.length > 0 && alarm.company && !companyFilters.includes(alarm.company)) {
                return false;
            }
            
            return true;
        });
    }, [driver?.alarmas, dateRange, typeFilters, companyFilters]);

    // IMPORTANTE: Usar las estadísticas del driver, no recalcular
    // Las estadísticas vienen del backend con TODAS las alarmas históricas
    const driverStats = driver?.stats;

    const handleClearFilters = () => {
        setTypeFilters([]);
        setCompanyFilters([]);
        setDateRange(undefined);
    };

    if (isLoading) {
        return <DriverDetailLoading />;
    }

    if (error || !driver) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive">{error || "Error al cargar el chofer"}</p>
            </div>
        );
    }

    const fullName = driver.apellido_nombre || "Chofer sin nombre";
    
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
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/drivers">Choferes</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{driver.apellido_nombre}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
                        <AvatarImage src={driver.foto || ''} alt={fullName} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                            {getInitials(fullName)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">{fullName}</h1>
                        <div className="flex flex-wrap items-center text-muted-foreground text-md gap-x-6 gap-y-1 mt-2">
                            <InfoRow icon={<Contact className="h-4 w-4 text-sky-500" />} value={`DNI: ${driver.dni || 'N/A'}`} />
                            <InfoRow icon={<Briefcase className="h-4 w-4 text-amber-500" />} value={driver.empresa || 'Sin Empresa'} />
                            <InfoRow icon={<CalendarDays className="h-4 w-4 text-violet-500" />} value={driver.anios ? `Legajo: ${driver.anios}` : 'Sin Legajo'} />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4 p-4 border bg-card rounded-lg">
                    <AdvancedFilters
                        dateRange={dateRange}
                        onDateChange={setDateRange}
                        onClear={handleClearFilters}
                        disabled={isLoading}
                        filterSections={[
                            {
                                title: 'Por Tipo de Alarma',
                                items: alarmTypes,
                                selectedItems: typeFilters,
                                onSelectionChange: setTypeFilters
                            },
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    {/* IMPORTANTE: Pasar las estadísticas completas del driver */}
                    <DriverStats stats={driverStats} />
                </div>
                <div className="lg:col-span-2">
                    <RecentAlarmsTable alarms={filteredAlarms} />
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

function DriverDetailLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-80" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Skeleton className="h-80 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-96 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}