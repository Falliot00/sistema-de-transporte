// app/dashboard/page.tsx
"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { KPICard } from "@/components/alarms/kpi-card";
import { mockDashboardKPIs, generateInitialMockAlarms, getAlarmCounts } from "@/lib/mock-data";
import { Alarm } from "@/types";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
// import { Button } from "@/components/ui/button"; // Button import can be removed if not directly used for "Actualizar"
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("resumen");

  useEffect(() => {
    setIsLoading(true);
    const fetchedAlarms = generateInitialMockAlarms();
    setAlarms(fetchedAlarms);
    setTimeout(() => setIsLoading(false), 500); // Shorter delay for UI dev
  }, [dateRange]);

  const dashboardKpis = mockDashboardKPIs.map(kpi => {
    const newKpi = {...kpi}; // Clone kpi to avoid mutating the original mock
    if (newKpi.id === "dashboard-confirmation-rate") {
      const counts = getAlarmCounts(alarms);
      if ((counts.confirmed + counts.rejected) > 0) {
        newKpi.value = parseFloat(((counts.confirmed / (counts.confirmed + counts.rejected)) * 100).toFixed(1)) || 0;
      } else {
        newKpi.value = 0;
      }
    }
    // Add other dynamic KPI calculations if needed
    return newKpi;
  });

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
            // Ensure KPICard handles suffix if present in kpi object, or format value here
            <KPICard key={kpi.id} kpi={{...kpi, value: `${kpi.value}${kpi.suffix || ''}`}} />
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