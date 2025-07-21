// frontend/app/dashboard/page.tsx
"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { KPICard } from "@/components/shared/kpi-card";
import { DashboardSummary } from "@/types";
import { getDashboardSummary } from '@/lib/api';
//import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Percent, Users, Server } from "lucide-react";
import { AdvancedFilters } from '@/components/shared/advanced-filters';
import { alarmTypes } from '@/lib/mock-data';

// Componente Skeleton (sin cambios)
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

// Lazy loading de pestañas (sin cambios)
const ResumenTab = dynamic(() => import('@/app/dashboard/resumen-tab').then(mod => mod.ResumenTab), { ssr: false, loading: () => <DashboardTabSkeleton /> });
const TendenciasTab = dynamic(() => import('@/app/dashboard/tendencias-tab').then(mod => mod.TendenciasTab), { ssr: false, loading: () => <DashboardTabSkeleton /> });
const ChoferesTab = dynamic(() => import('@/app/dashboard/choferes-tab').then(mod => mod.ChoferesTab), { ssr: false, loading: () => <DashboardTabSkeleton /> });
const DispositivosTab = dynamic(() => import('@/app/dashboard/dispositivos-tab').then(mod => mod.DispositivosTab), { ssr: false, loading: () => <DashboardTabSkeleton /> });

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];

export default function DashboardPage() {
  // --- CAMBIO: El estado de la fecha inicia como undefined ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [companyFilters, setCompanyFilters] = useState<string[]>([]);
  
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inicia en true para la carga inicial
  const [activeTab, setActiveTab] = useState<string>("resumen");

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await getDashboardSummary({
            // --- CAMBIO: Las fechas ahora pueden ser undefined, y la API las ignorará ---
            startDate: dateRange?.from?.toISOString(),
            endDate: dateRange?.to?.toISOString(),
            type: typeFilters,
            company: companyFilters,
        });
        setSummaryData(data);
    } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
    } finally {
        setIsLoading(false);
    }
  }, [dateRange, typeFilters, companyFilters]);

  useEffect(() => { 
    fetchSummary(); 
  }, [fetchSummary]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardActiveTab", value);
    }
  };

  useEffect(() => {
    const savedTab = localStorage.getItem("dashboardActiveTab");
    if (savedTab && ["resumen", "tendencias", "choferes", "dispositivos"].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);
  
  const handleClearFilters = () => {
      setTypeFilters([]);
      setCompanyFilters([]);
      // --- CAMBIO: Limpiar el filtro de fecha lo establece en undefined ---
      setDateRange(undefined);
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">Panel de Análisis</h1>
                <p className="text-muted-foreground">
                    {dateRange ? 'Visualizando métricas para el período seleccionado.' : 'Busca y visualiza la información de las alarmas del sistema.'}
                </p>
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Alarmas" icon={<Bell />} value={isLoading ? '...' : summaryData?.kpis.totalAlarms ?? 0} iconClassName="text-black-500" />
            <KPICard title="Tasa de Confirmación" icon={<Percent />} value={isLoading ? '...' : `${summaryData?.kpis.confirmationRate ?? '0.0'}%`} description="Del total de alarmas procesadas." iconClassName="text-green-500" />
            <KPICard title="Promedio de Choferes" icon={<Users />} value={isLoading ? '...' : summaryData?.kpis.avgAlarmsPerDriver ?? '0.0'} description="Promedio de alarmas confirmadas por chofer." iconClassName="text-blue-500" />
            <KPICard title="Promedios de Dispositivos" icon={<Server />} value={isLoading ? '...' : summaryData?.kpis.avgAlarmsPerDevice ?? '0.0'} description="Promedio de alarmas confirmadas por dispositivo." iconClassName="text-orange-500" />
        </div>

        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="space-y-4 p-4 border bg-card rounded-lg">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
            <TabsTrigger value="choferes">Choferes</TabsTrigger>
            <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
          </TabsList>
</div>
          <TabsContent value="resumen" className="mt-0">
            {isLoading || !summaryData ? <DashboardTabSkeleton /> : (
                <ResumenTab 
                    alarmsByDayData={summaryData.alarmsByDay}
                    alarmsByTypeData={summaryData.alarmsByType}
                    alarmStatusProgressData={summaryData.alarmStatusProgress}
                />
            )}
          </TabsContent>
          
          <TabsContent value="tendencias" className="mt-0">
            {isLoading || !summaryData ? <DashboardTabSkeleton /> : (
                <TendenciasTab 
                    hourlyData={summaryData.hourlyDistribution} 
                    alarmsByDayData={summaryData.alarmsByDay}
                />
            )}
          </TabsContent>

          <TabsContent value="choferes" className="mt-0">
            {isLoading || !summaryData ? <DashboardTabSkeleton /> : (
                <ChoferesTab drivers={summaryData.driverRanking} />
            )}
          </TabsContent>
          
          <TabsContent value="dispositivos" className="mt-0">
            {isLoading || !summaryData ? <DashboardTabSkeleton /> : (
                <DispositivosTab 
                    topDevices={summaryData.topDevices} 
                />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}