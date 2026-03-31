// frontend/app/dashboard/page.tsx
"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { DashboardSummary } from "@/types";
import { getAnomalias, getDashboardSummary } from '@/lib/api';
import { getApiDateRange, formatCorrectedTimestamp } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { AdvancedFilters, FilterOption } from '@/components/shared/advanced-filters';
import { alarmTypes } from '@/lib/mock-data';

const DashboardTabSkeleton = () => (
    <div className="space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
            <Skeleton className="lg:col-span-4 h-[350px]" />
            <Skeleton className="lg:col-span-3 h-[350px]" />
        </div>
    </div>
);

const ProcesoATab = dynamic(() => import('@/app/dashboard/proceso-a-tab').then(mod => mod.ProcesoATab), { ssr: false, loading: () => <DashboardTabSkeleton /> });
const ProcesoBTab = dynamic(() => import('@/app/dashboard/proceso-b-tab').then(mod => mod.ProcesoBTab), { ssr: false, loading: () => <DashboardTabSkeleton /> });
const ChoferesTab = dynamic(() => import('@/app/dashboard/choferes-tab').then(mod => mod.ChoferesTab), { ssr: false, loading: () => <DashboardTabSkeleton /> });

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];

function formatSubtitleDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  return formatCorrectedTimestamp(isoDate, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [companyFilters, setCompanyFilters] = useState<string[]>([]);
  const [anomalyFilters, setAnomalyFilters] = useState<string[]>([]);
  const [anomalyOptions, setAnomalyOptions] = useState<FilterOption[]>([]);
  
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("procesoA");
  const latestRequestRef = useRef(0);

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

  const fetchSummary = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    setIsLoading(true);
    try {
        const { startDate, endDate } = getApiDateRange(dateRange);
        const data = await getDashboardSummary({
            startDate,
            endDate,
            type: typeFilters,
            company: companyFilters,
            anomaly: anomalyFilters,
        });
        if (requestId !== latestRequestRef.current) {
          return;
        }
        setSummaryData(data);
    } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
    } finally {
        if (requestId === latestRequestRef.current) {
          setIsLoading(false);
        }
    }
  }, [dateRange, typeFilters, companyFilters, anomalyFilters]);

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
    if (savedTab && ["procesoA", "procesoB", "choferes"].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);
  
  const handleClearFilters = () => {
      setTypeFilters([]);
      setCompanyFilters([]);
      setAnomalyFilters([]);
      setDateRange(undefined);
  };

  // Build subtitle
  const subtitleText = (() => {
    if (isLoading || !summaryData) return 'Cargando datos...';
    const total = summaryData.totalAlarms;
    const desde = formatSubtitleDate(summaryData.oldestDate);
    const hasta = formatSubtitleDate(summaryData.newestDate);
    return `Total de alarmas: ${total.toLocaleString('es-AR')} (desde el ${desde} hasta ${hasta})`;
  })();

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">Panel de Análisis</h1>
                <p className="text-muted-foreground">{subtitleText}</p>
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
                      },
                      {
                          title: 'Por Anomalia',
                          items: anomalyOptions,
                          selectedItems: anomalyFilters,
                          onSelectionChange: setAnomalyFilters
                      }
                  ]}
              />
            </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="space-y-4 p-4 border bg-card rounded-lg">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="procesoA">Proceso A</TabsTrigger>
            <TabsTrigger value="procesoB">Proceso B</TabsTrigger>
            <TabsTrigger value="choferes">Choferes</TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="procesoA" className="mt-0">
            {isLoading || !summaryData ? <DashboardTabSkeleton /> : (
                <ProcesoATab data={summaryData.procesoA} />
            )}
          </TabsContent>
          
          <TabsContent value="procesoB" className="mt-0">
            {isLoading || !summaryData ? <DashboardTabSkeleton /> : (
                <ProcesoBTab data={summaryData.procesoB} />
            )}
          </TabsContent>

          <TabsContent value="choferes" className="mt-0">
            {isLoading || !summaryData ? <DashboardTabSkeleton /> : (
                <ChoferesTab 
                  drivers={summaryData.driverRanking} 
                  dateRange={dateRange || undefined}
                />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
