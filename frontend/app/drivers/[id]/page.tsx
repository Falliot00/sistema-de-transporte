// frontend/app/drivers/[id]/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';
import { getAnomalias, getDriverDetails } from "@/lib/api";
import { useParams, notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, CalendarDays, Contact } from "lucide-react";
import type { Driver as DriverType } from "@/types";
import { AdvancedFilters } from '@/components/shared/advanced-filters';
import type { FilterOption } from '@/components/shared/advanced-filters';
import type { DateRange } from 'react-day-picker';
import { alarmTypes } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiDateRange } from '@/lib/utils';

const RecentAlarmsTable = dynamic(
    () => import("@/components/drivers/recent-alarms-table").then((mod) => mod.RecentAlarmsTable),
    {
        loading: () => <Skeleton className="h-[460px] w-full rounded-lg" />,
    }
);

const GeneratedReportsTable = dynamic(
    () => import("@/components/drivers/generated-reports-table").then((mod) => mod.GeneratedReportsTable),
    {
        loading: () => <Skeleton className="h-[380px] w-full rounded-lg" />,
    }
);

const DriverPerformanceTab = dynamic(
    () => import("./driver-performance-tab").then((mod) => mod.DriverPerformanceTab),
    {
        loading: () => (
            <div className="space-y-6 mt-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="h-28 w-full" />
                    ))}
                </div>
                <Skeleton className="h-[420px] w-full rounded-lg" />
            </div>
        ),
    }
);

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];
const DRIVER_DETAIL_TAB_KEY = "driverDetailActiveTab";

export default function DriverDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [driver, setDriver] = useState<DriverType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingAlarms, setIsLoadingAlarms] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [companyFilters, setCompanyFilters] = useState<string[]>([]);
    const [anomalyFilters, setAnomalyFilters] = useState<string[]>([]);
    const [anomalyOptions, setAnomalyOptions] = useState<FilterOption[]>([]);
    const [activeTab, setActiveTab] = useState<string>("alarmas");

    useEffect(() => {
        let isMounted = true;

        const loadAnomalies = async () => {
            const anomalies = await getAnomalias();
            if (!isMounted) return;

            const options = anomalies
                .filter((anomaly) => anomaly.idAnomalia != null)
                .map((anomaly) => ({
                    value: String(anomaly.idAnomalia),
                    label: anomaly.nomAnomalia?.trim() || `Anomalia ${anomaly.idAnomalia}`,
                }));

            setAnomalyOptions(options);
        };

        loadAnomalies();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const savedTab = localStorage.getItem(DRIVER_DETAIL_TAB_KEY);
        if (savedTab && ["alarmas", "informes", "desempeno"].includes(savedTab)) {
            setActiveTab(savedTab);
        }
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        localStorage.setItem(DRIVER_DETAIL_TAB_KEY, value);
    };

    const loadDriverData = async () => {
        try {
            setIsLoadingAlarms(true);
            const { startDate, endDate } = getApiDateRange(dateRange);
            const data = await getDriverDetails(id, {
                startDate,
                endDate,
                type: typeFilters,
                company: companyFilters,
                anomaly: anomalyFilters,
            });
            setDriver(data);
        } catch (loadError: any) {
            if (loadError.status === 404) {
                notFound();
            }
            setError("No se pudieron cargar los detalles del chofer.");
        } finally {
            setIsLoading(false);
            setIsLoadingAlarms(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        loadDriverData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!isLoading && driver) {
            loadDriverData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, typeFilters, companyFilters, anomalyFilters]);

    const handleClearFilters = () => {
        setTypeFilters([]);
        setCompanyFilters([]);
        setAnomalyFilters([]);
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
                        <AvatarImage src={driver.foto || ''} alt={fullName} className="object-cover" decoding="async" />
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
                        disabled={isLoadingAlarms}
                        filterSections={[
                            {
                                title: 'Por Tipo de Alarma',
                                items: alarmTypes,
                                selectedItems: typeFilters,
                                onSelectionChange: setTypeFilters,
                            },
                            {
                                title: 'Por Empresa',
                                items: AVAILABLE_COMPANIES,
                                selectedItems: companyFilters,
                                onSelectionChange: setCompanyFilters,
                            },
                            {
                                title: 'Por Anomalia',
                                items: anomalyOptions,
                                selectedItems: anomalyFilters,
                                onSelectionChange: setAnomalyFilters,
                            },
                        ]}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="space-y-4 p-4 border bg-card rounded-lg">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="alarmas">Alarmas asignadas</TabsTrigger>
                        <TabsTrigger value="informes">Informes generados</TabsTrigger>
                        <TabsTrigger value="desempeno">Desempeño</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="alarmas" className="mt-0">
                    {activeTab === "alarmas" ? (
                        <RecentAlarmsTable
                            alarms={driver.alarmas || []}
                            isLoading={isLoadingAlarms}
                            onReportGenerated={loadDriverData}
                        />
                    ) : null}
                </TabsContent>

                <TabsContent value="informes" className="mt-0">
                    {activeTab === "informes" ? (
                        <GeneratedReportsTable
                            reports={driver.informes || []}
                            isLoading={isLoadingAlarms}
                        />
                    ) : null}
                </TabsContent>

                <TabsContent value="desempeno" className="mt-0">
                    {activeTab === "desempeno" ? (
                        <DriverPerformanceTab
                            alarms={driver.alarmas || []}
                            reports={driver.informes || []}
                            isLoading={isLoadingAlarms}
                        />
                    ) : null}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
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

            <div className="space-y-4 p-4 border bg-card rounded-lg">
                <Skeleton className="h-10 w-full" />
            </div>

            <Skeleton className="h-[520px] w-full rounded-lg" />
        </div>
    );
}
