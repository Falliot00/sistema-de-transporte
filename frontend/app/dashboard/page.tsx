// frontend/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { DashboardSummary } from "@/types";
import { getAnomalias, getDashboardSummary } from '@/lib/api';
import { getApiDateRange, formatCorrectedTimestamp } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from 'react-day-picker';
import { AdvancedFilters, FilterOption } from '@/components/shared/advanced-filters';
import { alarmTypes } from '@/lib/mock-data';
import { ProcesoATab } from '@/app/dashboard/proceso-a-tab';
import { ProcesoBTab } from '@/app/dashboard/proceso-b-tab';
import { ChoferesTab } from '@/app/dashboard/choferes-tab';

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];
const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  totalAlarms: 0,
  oldestDate: null,
  newestDate: null,
  procesoA: {
    sospechadas: 0,
    rechazadas: 0,
    pendientes: 0,
    volumenPorDia: [],
    alarmasPorDia: [],
    distribucionHoraria: [],
  },
  procesoB: {
    confirmadas: 0,
    rechazadas: 0,
    sospechosasSinProcesar: 0,
    tasaConfirmacion: "0",
    volumenSospechosasPorDia: [],
    alarmasPorDia: [],
    distribucionPorAnomalia: [],
  },
  driverRanking: [],
};

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
  const resolvedSummary = summaryData ?? EMPTY_DASHBOARD_SUMMARY;

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
            <ProcesoATab data={resolvedSummary.procesoA} />
          </TabsContent>
          
          <TabsContent value="procesoB" className="mt-0">
            <ProcesoBTab data={resolvedSummary.procesoB} />
          </TabsContent>

          <TabsContent value="choferes" className="mt-0">
            <ChoferesTab
              drivers={resolvedSummary.driverRanking}
              dateRange={dateRange || undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
