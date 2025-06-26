// app/dashboard/page.tsx
"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { KPICard } from "@/components/alarms/kpi-card";
import { DashboardSummary } from "@/types";
import { getDashboardSummary } from '@/lib/api';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Percent, Activity, Server } from "lucide-react";
import { subDays } from 'date-fns';

// Lazy load tab content
const ResumenTab = dynamic(() => 
  import('@/app/dashboard/resumen-tab').then(mod => mod.ResumenTab), 
  { ssr: false, loading: () => <DashboardTabSkeleton /> }
);
const TendenciasTab = dynamic(() => 
  import('@/app/dashboard/tendencias-tab').then(mod => mod.TendenciasTab), 
  { ssr: false, loading: () => <DashboardTabSkeleton /> }
);
const ChoferesTab = dynamic(() => 
  import('@/app/dashboard/choferes-tab').then(mod => mod.ChoferesTab), 
  { ssr: false, loading: () => <DashboardTabSkeleton /> }
);
const DispositivosTab = dynamic(() => 
  import('@/app/dashboard/dispositivos-tab').then(mod => mod.DispositivosTab), 
  { ssr: false, loading: () => <DashboardTabSkeleton /> }
);

const DashboardTabSkeleton = () => (
    <div className="space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
            <Skeleton className="lg:col-span-4 h-[350px]" />
            <Skeleton className="lg:col-span-3 h-[350px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
    </div>
);


export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  
  
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("resumen");

  const fetchSummary = useCallback(async () => {
    if (dateRange?.from && dateRange?.to) {
        setIsLoading(true);
        const data = await getDashboardSummary({
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
        });
        setSummaryData(data);
        setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleDateRangeChange = (newRange?: DateRange) => {
    setDateRange(newRange);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("dashboardActiveTab");
      if (savedTab && ["resumen", "tendencias", "choferes", "dispositivos"].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardActiveTab", value);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Alarmas</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Choferes</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">Panel de Análisis</h1>
                <p className="text-muted-foreground">
                    Busca, visualiza y gestiona la información de las alarmas del sistema.
                </p>
            </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
            <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} disabled={isLoading} className="w-full sm:w-auto"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Alarmas" icon={<Bell />} value={isLoading ? '...' : summaryData?.kpis.totalAlarms ?? 0} />
            <KPICard title="Tasa de Confirmación" icon={<Percent />} value={isLoading ? '...' : `${summaryData?.kpis.confirmationRate ?? 0}%`} />
            <KPICard title="Tiempo Resp. Prom." icon={<Activity />} value={isLoading ? '...' : 'N/A'} description="(Próximamente)" />
            <KPICard title="Dispositivos Activos" icon={<Server />} value={isLoading ? '...' : 'N/A'} description="(Próximamente)" />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
            <TabsTrigger value="choferes">Choferes</TabsTrigger>
            <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-0">
            {isLoading || !summaryData ? (
                <DashboardTabSkeleton />
            ) : (
                <ResumenTab 
                    alarmsByDayData={summaryData.alarmsByDay}
                    alarmsByTypeData={summaryData.alarmsByType}
                    alarmStatusProgressData={summaryData.alarmStatusProgress}
                />
            )}
          </TabsContent>
          
          <TabsContent value="tendencias" className="mt-0">
            {isLoading || !summaryData ? (
                <DashboardTabSkeleton />
            ) : (
                <TendenciasTab 
                    hourlyData={summaryData.hourlyDistribution} 
                    weeklyData={summaryData.weeklyTrend} 
                />
            )}
          </TabsContent>

           {/* --- INICIO DE LA SOLUCIÓN: Pasar datos a las pestañas de Choferes y Dispositivos --- */}
          <TabsContent value="choferes" className="mt-0">
            {isLoading || !summaryData ? (
                <DashboardTabSkeleton />
            ) : (
                <ChoferesTab drivers={summaryData.driverRanking} />
            )}
          </TabsContent>
          <TabsContent value="dispositivos" className="mt-0">
            {isLoading || !summaryData ? (
                <DashboardTabSkeleton />
            ) : (
                <DispositivosTab 
                    deviceSummary={summaryData.deviceSummary} 
                    topDevices={summaryData.topDevices} 
                />
            )}
          </TabsContent>
          {/* --- FIN DE LA SOLUCIÓN --- */}
        </Tabs>
      </div>
    </PageLayout>
  );
}