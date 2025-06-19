// app/dashboard/page.tsx
"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { KPICard } from "@/components/alarms/kpi-card";
// REMOVIDO: import { mockDashboardKPIs, generateInitialMockAlarms, getAlarmCounts } from "@/lib/mock-data";
import { Alarm } from "@/types";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Percent, Activity, Server } from "lucide-react"; // Importar iconos directamente

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
  <div className="space-y-4 mt-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-[350px] w-full" />
      <Skeleton className="h-[350px] w-full" />
    </div>
    <Skeleton className="h-[200px] w-full" />
  </div>
);

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 29)),
    to: new Date(),
  });
  // CAMBIO: alarms se inicializa como un array vacío
  const [alarms, setAlarms] = useState<Alarm[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("resumen");

  useEffect(() => {
    // CAMBIO: No cargar datos mock aquí.
    // En un sistema real, aquí iría la lógica para cargar datos reales de tu API
    // basada en el dateRange seleccionado.
    setIsLoading(true);
    // Simular carga de datos (vacíos por ahora)
    setTimeout(() => {
      setAlarms([]); // Asegurarse de que las alarmas estén vacías
      setIsLoading(false);
    }, 500); // Pequeño delay para simular una carga
  }, [dateRange]);

  // CAMBIO: Definición de KPIs que no dependen de mock-data.ts
  const dashboardKpis = [
    {
      id: "dashboard-total-alarms",
      title: "Total Alarmas (Mes)",
      value: isLoading ? "..." : alarms.length, // Mostrar el total real de alarmas (0 por ahora)
      icon: <Bell className="h-4 w-4" />,
      delta: null, // No hay delta sin datos históricos
      deltaType: 'neutral',
    },
    {
      id: "dashboard-confirmation-rate",
      title: "Tasa de Confirmación",
      value: isLoading ? "..." : (alarms.length > 0 ? "0%" : "0%"), // Sin datos, 0%
      icon: <Percent className="h-4 w-4" />,
      delta: null,
      deltaType: 'neutral',
      suffix: '%', 
    },
    {
      id: "dashboard-response-time",
      title: "Tiempo Resp. Prom.",
      value: isLoading ? "..." : "-", // O "N/A"
      icon: <Activity className="h-4 w-4" />, 
      delta: null,
      deltaType: 'neutral', 
      suffix: ' min', 
    },
    {
      id: "dashboard-active-devices",
      title: "Dispositivos Activos",
      value: isLoading ? "..." : "0", // Sin datos, 0 dispositivos
      icon: <Server className="h-4 w-4" />, 
      delta: null,
      deltaType: 'neutral',
    },
  ];

  const handleDateRangeChange = (newRange?: DateRange) => {
    setDateRange(newRange);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardActiveTab", value);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("dashboardActiveTab");
      if (savedTab && ["resumen", "tendencias", "choferes", "dispositivos"].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard de Estadísticas</h1>
            <Breadcrumb className="mt-1 md:mt-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Alarmas</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
            <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} className="w-full sm:w-auto"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardKpis.map((kpi) => (
            <KPICard 
              key={kpi.id} 
              title={kpi.title} 
              value={kpi.value} 
              icon={kpi.icon} 
              // Si tienes description y otros campos en KPICard, pásalos también
              // Asegúrate de que KPICard pueda manejar `null` o `undefined` para delta/deltaType si no se usan
            />
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
            <TabsTrigger value="choferes">Choferes</TabsTrigger>
            <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-0">
            {isLoading ? <DashboardTabSkeleton /> : <ResumenTab alarms={alarms} />}
          </TabsContent>
          <TabsContent value="tendencias" className="mt-0">
             {isLoading ? <DashboardTabSkeleton /> : <TendenciasTab alarms={alarms} />}
          </TabsContent>
          <TabsContent value="choferes" className="mt-0">
             {isLoading ? <DashboardTabSkeleton /> : <ChoferesTab />}
          </TabsContent>
          <TabsContent value="dispositivos" className="mt-0">
            {isLoading ? <DashboardTabSkeleton /> : <DispositivosTab />}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}