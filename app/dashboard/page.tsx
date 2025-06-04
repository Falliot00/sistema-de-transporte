// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/app/dashboard/page.tsx
"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { KPICard } from "@/components/alarms/kpi-card";
import { mockDashboardKPIs, generateInitialMockAlarms, getAlarmCounts } from "@/lib/mock-data";
import { Alarm } from "@/types";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton'; // For loading states

// Lazy load tab content
const ResumenTab = dynamic(() => import('@/components/dashboard/resumen-tab').then(mod => mod.ResumenTab), { 
  ssr: false, 
  loading: () => <DashboardTabSkeleton /> 
});
const TendenciasTab = dynamic(() => import('@/components/dashboard/tendencias-tab').then(mod => mod.TendenciasTab), { 
  ssr: false, 
  loading: () => <DashboardTabSkeleton /> 
});
const ChoferesTab = dynamic(() => import('@/components/dashboard/choferes-tab').then(mod => mod.ChoferesTab), { 
  ssr: false, 
  loading: () => <DashboardTabSkeleton /> 
});
const DispositivosTab = dynamic(() => import('@/components/dashboard/dispositivos-tab').then(mod => mod.DispositivosTab), { 
  ssr: false, 
  loading: () => <DashboardTabSkeleton /> 
});


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
    from: new Date(new Date().setDate(new Date().getDate() - 29)), // Default to last 30 days
    to: new Date(),
  });
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("resumen");

  useEffect(() => {
    // Simulate data fetching
    setIsLoading(true);
    const fetchedAlarms = generateInitialMockAlarms(); // Or fetch based on dateRange
    setAlarms(fetchedAlarms);
    // Here you would typically filter alarms based on dateRange if fetching all
    // For now, we pass all alarms and let components filter or use pre-aggregated mock data
    setTimeout(() => setIsLoading(false), 1000); 
  }, [dateRange]);

  const dashboardKpis = mockDashboardKPIs.map(kpi => {
    if (kpi.id === "dashboard-total-alarms") {
      // This could be dynamically calculated from 'alarms' if they were filtered by dateRange
      // For now, using the mock value directly
    } else if (kpi.id === "dashboard-confirmation-rate") {
      const counts = getAlarmCounts(alarms);
      if (counts.all > 0) {
        kpi.value = parseFloat(((counts.confirmed / (counts.confirmed + counts.rejected)) * 100).toFixed(1)) || 0;
      } else {
        kpi.value = 0;
      }
    }
    return kpi;
  });

  const handleDateRangeChange = (newRange?: DateRange) => {
    setDateRange(newRange);
    // Data fetching/filtering logic would go here
    console.log("Date range changed:", newRange);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Potentially persist tab selection
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardActiveTab", value);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("dashboardActiveTab");
      if (savedTab) {
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
            {/* <Button onClick={() => console.log("Actualizar datos con rango:", dateRange)}>Actualizar</Button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardKpis.map((kpi) => (
            <KPICard key={kpi.id} kpi={{...kpi, title: kpi.title, value: `${kpi.value}${kpi.suffix || ''}`}} />
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