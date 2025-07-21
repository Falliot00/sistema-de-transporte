// frontend/app/devices/[id]/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { getDispositivoDetails, getAlarms } from "@/lib/api";
import { useParams, notFound } from "next/navigation";
import { DeviceDetails as DeviceDetailsType, Alarm } from "@/types";
import { Home, Server, Hash, Wifi, Filter } from "lucide-react";
import { DeviceStatsCards } from "./device-stats-cards";
import { AlarmsByWeekdayChart } from "./alarms-by-weekday-chart";
import { AdvancedFilters } from '@/components/shared/advanced-filters';
import { DateRange } from 'react-day-picker';
import { alarmTypes } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAlarmStatusInfo, formatCorrectedTimestamp } from '@/lib/utils';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,} from "@/components/ui/breadcrumb";

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];

export default function DeviceDetailPage() {
    const params = useParams();
    const id = params.id as string;
    
    const [device, setDevice] = useState<DeviceDetailsType | null>(null);
    const [deviceAlarms, setDeviceAlarms] = useState<Alarm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingAlarms, setIsLoadingAlarms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Estados de filtros
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [companyFilters, setCompanyFilters] = useState<string[]>([]);

    // Cargar detalles del dispositivo
    useEffect(() => {
        const loadDevice = async () => {
            try {
                setIsLoading(true);
                const data = await getDispositivoDetails(id);
                setDevice(data);
            } catch (error: any) {
                if (error.status === 404) notFound();
                setError("No se pudieron cargar los detalles del dispositivo.");
            } finally {
                setIsLoading(false);
            }
        };
        
        loadDevice();
    }, [id]);

    // Cargar alarmas del dispositivo con filtros
    useEffect(() => {
        if (!device) return;
        
        const loadAlarms = async () => {
            try {
                setIsLoadingAlarms(true);
                
                // IMPORTANTE: Usar el interno del dispositivo para buscar
                // La API espera que busquemos por el número interno
                const searchQuery = device.nroInterno ? device.nroInterno.toString() : '';
                
                const response = await getAlarms({
                    search: searchQuery,
                    type: typeFilters.length > 0 ? typeFilters : undefined,
                    company: companyFilters.length > 0 ? companyFilters : undefined,
                    startDate: dateRange?.from?.toISOString(),
                    endDate: dateRange?.to?.toISOString(),
                    pageSize: 100, // Obtener más alarmas para el dispositivo
                    page: 1
                });
                
                // Filtrar las alarmas que pertenecen a este dispositivo específico
                // Verificamos tanto por ID del dispositivo como por interno
                const filteredAlarms = response.alarms.filter(alarm => {
                    // Verificar por ID del dispositivo
                    if (alarm.device?.serialNumber === device.idDispositivo.toString()) {
                        return true;
                    }
                    // Verificar por número interno
                    if (device.nroInterno && alarm.vehicle?.interno === device.nroInterno.toString()) {
                        return true;
                    }
                    return false;
                });
                
                setDeviceAlarms(filteredAlarms);
            } catch (error) {
                console.error("Error al cargar alarmas del dispositivo:", error);
                setDeviceAlarms([]);
            } finally {
                setIsLoadingAlarms(false);
            }
        };
        
        loadAlarms();
    }, [device, dateRange, typeFilters, companyFilters]);

    // Recalcular estadísticas basándose en las alarmas filtradas
    const filteredStats = useMemo(() => {
        const stats = {
            totalAlarms: deviceAlarms.length,
            totalAlarmsConfirmed: deviceAlarms.filter(a => a.status === 'confirmed').length,
            alarmsByWeekday: [] as any[]
        };
        
        // Recalcular alarmas por día de la semana
        const weekdayCount: Record<string, number> = {};
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        
        deviceAlarms.forEach(alarm => {
            const date = new Date(alarm.timestamp);
            const dayName = dayNames[date.getDay()];
            weekdayCount[dayName] = (weekdayCount[dayName] || 0) + 1;
        });
        
        stats.alarmsByWeekday = dayNames.map((day, index) => ({
            dayName: day,
            dayOfWeek: index,
            total: weekdayCount[day] || 0
        }));
        
        return stats;
    }, [deviceAlarms]);

    const handleClearFilters = () => {
        setTypeFilters([]);
        setCompanyFilters([]);
        setDateRange(undefined);
    };

    if (isLoading) {
        return <DeviceDetailLoading />;
    }

    if (error || !device) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive">{error || "Error al cargar el dispositivo"}</p>
            </div>
        );
    }

    const deviceName = `Interno ${device.nroInterno || device.idDispositivo}`;

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/devices">Dispositivos</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Interno {device.nroInterno}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-6">
                    <div className="p-4 rounded-full bg-primary/10 border">
                        <Server className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">{deviceName}</h1>
                        <div className="flex flex-wrap items-center text-md gap-x-6 gap-y-1 mt-2">
                            <InfoRow icon={<Hash className="h-4 w-4 text-sky-500" />} label="Patente" value={device.patente || 'N/A'} />
                            <InfoRow icon={<Wifi className="h-4 w-4 text-amber-500" />} label="SIM" value={device.sim || 'N/A'} />
                            <InfoRow icon={<Server className="h-4 w-4 text-violet-500" />} label="ID Dispositivo" value={device.idDispositivo} />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4 p-4 border bg-card rounded-lg">
                    <AdvancedFilters
                        dateRange={dateRange}
                        onDateChange={setDateRange}
                        onClear={handleClearFilters}
                        disabled={isLoadingAlarms}
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
            
            {/* Usar las estadísticas del dispositivo para el total histórico */}
            <DeviceStatsCards 
                stats={device.stats} 
                topAlarmTypes={device.topAlarmTypes} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlarmsByWeekdayChart data={filteredStats.alarmsByWeekday} />
                
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Alarmas Recientes
                            {deviceAlarms.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {deviceAlarms.length}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAlarms ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : deviceAlarms.length > 0 ? (
                            <div className="border rounded-md max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {deviceAlarms.map((alarm) => {
                                            const statusInfo = getAlarmStatusInfo(alarm.status);
                                            return (
                                                <TableRow key={alarm.id}>
                                                    <TableCell className="font-medium">{alarm.type}</TableCell>
                                                    <TableCell>{formatCorrectedTimestamp(alarm.timestamp, { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusInfo.variant as any} className="capitalize">
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No se encontraron alarmas con los filtros seleccionados.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function InfoRow({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function DeviceDetailLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-80" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>

            <Skeleton className="h-96 w-full rounded-lg" />
        </div>
    );
}