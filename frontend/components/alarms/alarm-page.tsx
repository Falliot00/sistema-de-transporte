// frontend/components/alarms/alarm-page.tsx
'use client'

import { useEffect, useState, useCallback } from "react";
import { Alarm, PaginationInfo, GlobalAlarmCounts, GetAlarmsParams } from "@/types";
import { getAlarms, reviewAlarm, confirmAlarm, reEvaluateAlarm, getAlarmsCount, undoAlarm, assignDriver } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAlarmNavigation } from "@/hooks/use-alarm-navigation";
import { AlarmCard } from "./alarm-card";
import { AlarmDetails } from "./alarm-details";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, Bell, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { AlarmAnalysisView } from "./alarm-analysis-view";
//import { AlarmActionForm } from "./alarm-action-form";
import { ALARM_STATUS_ES_PLURAL, ALARM_STATUS_VARIANT } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdvancedFilters } from "@/components/shared/advanced-filters";
import { KPICard } from "@/components/shared/kpi-card";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "../ui/pagination-controls";
import { alarmTypes } from "@/lib/mock-data";
//import { DateRangePicker } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";
// --- ELIMINADO: Ya no usaremos este componente aquí ---
// import { AnalysisFilters } from "./analysis-filters";

function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const AVAILABLE_COMPANIES = ['Laguna Paiva', 'Monte Vera'];
const ANALYSIS_PAGE_SIZE = 50;
const ANALYSIS_PRELOAD_PAGES = 3;

export default function AlarmsPage() {
    const { toast } = useToast();
    
    const [globalAlarmCounts, setGlobalAlarmCounts] = useState<GlobalAlarmCounts>({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const role = typeof document !== 'undefined'
      ? (document.cookie.split('; ').find(c => c.startsWith('role='))?.split('=')[1] || 'USER')
      : 'USER';
    const [statusFilter, setStatusFilter] = useState<string>(role === 'USER' ? 'pending' : 'all');
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [companyFilters, setCompanyFilters] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // --- ELIMINADOS: Estados de filtros de análisis redundantes ---
    // const [analysisFilters, setAnalysisFilters] = ...
    // const [analysisCounts, setAnalysisCounts] = ...
    // const [isLoadingCounts, setIsLoadingCounts] = ...
    
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    const { 
        currentAlarm: alarmForDetails, 
        initialize: initializeNavigation, 
        reset: resetNavigation, 
        goToNext, 
        goToPrevious, 
        hasNext, 
        hasPrevious, 
        isNavigating, 
        removeAlarm,
        isLoadingMore,
        navigationState,
        updateCurrentAlarm
    } = useAlarmNavigation((error) => { toast({ title: "Error", description: error, variant: "destructive" }); });
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [analysisAlarms, setAnalysisAlarms] = useState<Alarm[]>([]);
    const [analysisIndex, setAnalysisIndex] = useState(0);
    const [analysisPage, setAnalysisPage] = useState(1);
    const [hasNextPageAnalysis, setHasNextPageAnalysis] = useState(false);
    const [isFetchingNextBatch, setIsFetchingNextBatch] = useState(false);
    const [analysisType, setAnalysisType] = useState<'pending' | 'suspicious' | null>(null);
    const [analysisTotalCount, setAnalysisTotalCount] = useState(0);
    const [lastProcessedAlarm, setLastProcessedAlarm] = useState<{alarm: Alarm, index: number} | null>(null);
    const [isUndoing, setIsUndoing] = useState<boolean>(false);

    const [filteredCounts, setFilteredCounts] = useState<GlobalAlarmCounts>({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });

    const fetchAlarms = useCallback(async () => { 
        setIsLoading(true); 
        setError(null); 
        try { 
            const params: GetAlarmsParams = { 
                page: currentPage, 
                pageSize: 12, 
                status: (role === 'USER' && (statusFilter === 'all' || statusFilter === 'confirmed')) ? 'pending' : statusFilter, 
                search: debouncedSearchQuery, 
                type: typeFilters, 
                company: companyFilters, 
                startDate: dateRange?.from?.toISOString(), 
                endDate: dateRange?.to?.toISOString(), 
            }; 
            const data = await getAlarms(params); 
            setAlarms(data.alarms); 
            setPaginationInfo(data.pagination); 
            setGlobalAlarmCounts(data.globalCounts);
            
            const baseParams = { 
                search: debouncedSearchQuery, 
                type: typeFilters, 
                company: companyFilters, 
                startDate: dateRange?.from?.toISOString(), 
                endDate: dateRange?.to?.toISOString() 
            };
            
            const [pendingCount, suspiciousCount, confirmedCount, rejectedCount] = await Promise.all([
                getAlarmsCount({ ...baseParams, status: 'pending' }),
                getAlarmsCount({ ...baseParams, status: 'suspicious' }),
                role === 'USER' ? Promise.resolve({ count: 0 }) : getAlarmsCount({ ...baseParams, status: 'confirmed' }),
                role === 'USER' ? Promise.resolve({ count: 0 }) : getAlarmsCount({ ...baseParams, status: 'rejected' })
            ]);
            
            setFilteredCounts({
                total: data.pagination.totalAlarms,
                pending: pendingCount.count,
                suspicious: suspiciousCount.count,
                confirmed: confirmedCount.count,
                rejected: rejectedCount.count
            });
        } catch (e) { 
            setError("Error de conexión: No se pudieron cargar las alarmas."); 
            setAlarms([]); 
            setPaginationInfo(null); 
            setGlobalAlarmCounts({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });
            setFilteredCounts({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });
        } finally { 
            setIsLoading(false); 
        } 
    }, [currentPage, statusFilter, debouncedSearchQuery, typeFilters, companyFilters, dateRange, role]);

    // --- ELIMINADO: useEffect y useCallback para fetchAnalysisCounts ---

    useEffect(() => { fetchAlarms(); }, [fetchAlarms]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter, debouncedSearchQuery, typeFilters, companyFilters, dateRange]);

    const handleStartAnalysis = async (status: 'pending' | 'suspicious') => {
        const count = status === 'pending' ? filteredCounts.pending : filteredCounts.suspicious;
        if (count === 0) { 
            toast({ title: "Sin alarmas para analizar", description: "No hay alarmas que coincidan con los filtros actuales." }); 
            return; 
        }
        
        setIsFetchingNextBatch(true);
        setAnalysisType(status);
        
        try {
            setAnalysisTotalCount(count);
            const params: GetAlarmsParams = { 
                status, 
                pageSize: ANALYSIS_PAGE_SIZE, 
                search: debouncedSearchQuery,
                type: typeFilters, 
                company: companyFilters, 
                startDate: dateRange?.from?.toISOString(), 
                endDate: dateRange?.to?.toISOString(), 
            };
            
            let allAlarms: Alarm[] = [];
            let currentHasNext: boolean = true;
            
            for (let page = 1; page <= ANALYSIS_PRELOAD_PAGES && currentHasNext; page++) {
                const data = await getAlarms({ ...params, page });
                allAlarms.push(...data.alarms);
                currentHasNext = data.pagination.hasNextPage;
            }
            
            if (allAlarms.length > 0) {
                setAnalysisAlarms(allAlarms);
                setHasNextPageAnalysis(currentHasNext);
                setAnalysisPage(Math.min(ANALYSIS_PRELOAD_PAGES, Math.ceil(allAlarms.length / ANALYSIS_PAGE_SIZE)));
                setAnalysisIndex(0);
                setLastProcessedAlarm(null);
                setIsAnalysisMode(true);
            } else {
                toast({ title: "Sin alarmas", description: `No se encontraron alarmas para analizar.` });
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudieron cargar las alarmas para el análisis.", variant: "destructive" });
        } finally {
            setIsFetchingNextBatch(false);
        }
    };
    
    const handleCardClick = (clickedAlarm: Alarm) => { 
        const navigableAlarms = alarms; 
        const index = navigableAlarms.findIndex(a => a.id === clickedAlarm.id); 
        initializeNavigation(navigableAlarms, index > -1 ? index : 0, { status: statusFilter, search: debouncedSearchQuery, type: typeFilters, company: companyFilters, startDate: dateRange?.from?.toISOString(), endDate: dateRange?.to?.toISOString(), pageSize: 12, hasMorePages: !!paginationInfo?.hasNextPage, currentPage: currentPage, totalAlarms: paginationInfo?.totalAlarms || alarms.length });
        setIsDialogOpen(true); 
    };

    const handleDialogClose = () => { 
        setIsDialogOpen(false); 
        resetNavigation(); 
    };

    const handleDialogAction = async (payload: {
  action: 'confirmed' | 'rejected',
  description: string,
  choferId?: number | null,
  anomalyId?: number | null
}) => {
  if (!alarmForDetails) return;

  const { action, description, choferId, anomalyId } = payload;
  const alarmIdToUpdate = alarmForDetails.id;
  setIsSubmitting(true);

  try {
    if (alarmForDetails.status === 'pending') {
      await reviewAlarm(alarmIdToUpdate, action, description, choferId ?? undefined);
    } else if (alarmForDetails.status === 'suspicious') {
      if (action === 'confirmed') {
        // VALIDACIÓN
        if (choferId == null) {
          toast({ title: "Falta chofer", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        if (anomalyId == null) {
          toast({ title: "Falta anomalía", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        // ✅ LLAMADA CORRECTA
        await confirmAlarm(alarmIdToUpdate, description, choferId, anomalyId);
      } else {
        await reviewAlarm(alarmIdToUpdate, action, description, choferId ?? undefined);
      }
    }
    toast({ title: "Alarma actualizada" });
    removeAlarm(alarmIdToUpdate);
    
    // Navigate to next/previous or close dialog
    if (hasNext) {
      await goToNext();
    } else if (hasPrevious) {
      goToPrevious();
    } else {
      handleDialogClose();
    }
    
    fetchAlarms();
  } catch (error: any) {
    toast({ title: "Error", variant: "destructive", description: error.message });
  } finally {
    setIsSubmitting(false);
  }
};

    const handleReEvaluate = async (payload: { action: 'confirmed' | 'rejected', description: string, choferId?: number | null }) => { 
        if (!alarmForDetails || payload.action === 'rejected') { 
            handleDialogClose(); 
            return; 
        }; 
        setIsSubmitting(true); 
        try { 
            await reEvaluateAlarm(alarmForDetails.id, payload.description); 
            toast({ title: "Alarma Re-evaluada", description: "El estado ha sido cambiado a 'Sospechosa'." }); 
            handleDialogClose(); 
            fetchAlarms(); 
        } catch (error: any) { 
            toast({ title: "Error", variant: "destructive", description: error.message }); 
        } finally { 
            setIsSubmitting(false); 
        } 
    };

    const handleLoadNextBatch = async () => {
        if (!hasNextPageAnalysis || !analysisType) return;
        setIsFetchingNextBatch(true);
        try {
            const params: GetAlarmsParams = { 
                status: analysisType, 
                pageSize: ANALYSIS_PAGE_SIZE, 
                search: debouncedSearchQuery,
                type: typeFilters, 
                company: companyFilters, 
                startDate: dateRange?.from?.toISOString(), 
                endDate: dateRange?.to?.toISOString(), 
            };
            const newAlarms: Alarm[] = [];
            let currentHasNext: boolean = hasNextPageAnalysis;
            const startPage = analysisPage + 1;
            for (let page = startPage; page < startPage + ANALYSIS_PRELOAD_PAGES && currentHasNext; page++) {
                const data = await getAlarms({ ...params, page });
                newAlarms.push(...data.alarms);
                currentHasNext = data.pagination.hasNextPage;
                setAnalysisPage(page);
            }
            if (newAlarms.length > 0) {
                setAnalysisAlarms(prev => [...prev, ...newAlarms]);
                setHasNextPageAnalysis(currentHasNext);
            } else {
                toast({ title: "Sin más alarmas", description: "No hay más alarmas para analizar." });
                setIsAnalysisMode(false);
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudo cargar el siguiente lote de alarmas.", variant: "destructive" });
        } finally {
            setIsFetchingNextBatch(false);
        }
    };
    
    const handleAnalysisAction = async (action: 'confirmed' | 'rejected' | 'skip') => {
        const currentAlarm = analysisAlarms[analysisIndex];
        if (!currentAlarm || isSubmitting) return;
        setLastProcessedAlarm({ alarm: currentAlarm, index: analysisIndex }); 
        if (action !== 'skip') {
            setIsSubmitting(true);
            try {
                let updatedAlarm: Alarm;
                if (currentAlarm.status === 'pending') { 
                    updatedAlarm = await reviewAlarm(currentAlarm.id, action); 
                } else { 
                    updatedAlarm = currentAlarm; 
                }
                const newAlarms = [...analysisAlarms]; 
                newAlarms[analysisIndex] = updatedAlarm; 
                setAnalysisAlarms(newAlarms);
                toast({ title: "Alarma Actualizada" });
                fetchAlarms(); 
            } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
                setLastProcessedAlarm(null); 
                setIsSubmitting(false);
                return;
            } finally {
                setIsSubmitting(false);
            }
        }
        const nextIndex = analysisIndex + 1;
        if (nextIndex >= analysisAlarms.length) {
            if (hasNextPageAnalysis) {
                await handleLoadNextBatch();
            } else {
                toast({ title: "Análisis Completado", description: "Has revisado todas las alarmas disponibles." });
                setIsAnalysisMode(false);
            }
        } else {
            setAnalysisIndex(nextIndex);
        }
    };
    
    const handleUndo = async () => { 
        if (!lastProcessedAlarm) return; 
        const { alarm, index } = lastProcessedAlarm; 
        if (alarm.status === 'pending') { 
            setAnalysisIndex(index); 
            setLastProcessedAlarm(null); 
            toast({ title: "Acción deshecha" }); 
            return; 
        } 
        setIsUndoing(true); 
        try { 
            const revertedAlarm = await undoAlarm(alarm.id); 
            const newAlarms = [...analysisAlarms]; 
            newAlarms[index] = revertedAlarm; 
            setAnalysisAlarms(newAlarms); 
            setAnalysisIndex(index); 
            setLastProcessedAlarm(null); 
            toast({ title: "Acción deshecha", description: `La alarma "${revertedAlarm.type}" fue restaurada a pendiente.` }); 
            fetchAlarms(); 
        } catch (error: any) { 
            toast({ title: "Error al deshacer", description: error.message, variant: "destructive" }); 
        } finally { 
            setIsUndoing(false); 
        } 
    };

    const handleDriverReassign = async (choferId: number | null) => {
        if (!alarmForDetails) return;
        
        setIsSubmitting(true);
        try {
            const updatedAlarm = await assignDriver(alarmForDetails.id, choferId);
            
            // Update the alarm in the current navigation state
            const currentAlarmList = alarms.map(alarm => 
                alarm.id === alarmForDetails.id ? updatedAlarm : alarm
            );
            setAlarms(currentAlarmList);
            
            toast({ 
                title: "Chofer actualizado", 
                description: choferId 
                    ? `Chofer asignado correctamente` 
                    : "Asignación de chofer removida"
            });
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.message || "Error al reasignar el chofer", 
                variant: "destructive" 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAlarmUpdate = (updatedAlarm: Alarm) => {
        // Update the alarm in the current list
        const currentAlarmList = alarms.map(alarm => 
            alarm.id === updatedAlarm.id ? updatedAlarm : alarm
        );
        setAlarms(currentAlarmList);
        
        // Also update the current alarm in the navigation hook
        updateCurrentAlarm(updatedAlarm);
        
        toast({
            title: "Alarma actualizada",
            description: "Los detalles de la alarma se guardaron correctamente."
        });
    };

    const currentAnalysisAlarm = analysisAlarms[analysisIndex];
    let confirmButtonText = "Confirmar"; 
    if (currentAnalysisAlarm?.status === 'pending') {
        confirmButtonText = "Sospechosa";
    }

    const handleClearFilters = () => {
        setTypeFilters([]);
        setCompanyFilters([]);
        setDateRange(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div> 
                    <h1 className="text-3xl font-bold">Gestión de Alarmas</h1> 
                    <p className="text-muted-foreground">Revise, confirme o rechace las alarmas generadas por los dispositivos.</p> 
                </div>
                {/* --- CAMBIO: Filtros principales movidos aquí --- */}
                <div className="space-y-4 p-4 border bg-card rounded-lg">
                <div className="flex gap-2 items-center w-full sm:w-auto"> 
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
            </div>  

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KPICard title="Total de alarmas" value={isLoading ? '...' : globalAlarmCounts.total.toLocaleString()} icon={<Bell className="h-4 w-4" />} iconClassName="text-black-500"/>
                <KPICard title="Total de pendientes" value={isLoading ? '...' : globalAlarmCounts.pending.toLocaleString()} icon={<Clock className="h-4 w-4" />} iconClassName="text-yellow-500" />
                <KPICard title="Total de sospechosas" value={isLoading ? '...' : globalAlarmCounts.suspicious.toLocaleString()} icon={<AlertTriangle className="h-4 w-4" />} iconClassName="text-blue-500" />
                {role !== 'USER' && (
                  <>
                    <KPICard title="Total de confirmadas" value={isLoading ? '...' : globalAlarmCounts.confirmed.toLocaleString()} icon={<CheckCircle className="h-4 w-4" />} iconClassName="text-green-500" />
                    <KPICard title="Total de rechazadas" value={isLoading ? '...' : globalAlarmCounts.rejected.toLocaleString()} icon={<XCircle className="h-4 w-4" />} iconClassName="text-red-500" />
                  </>
                )}
            </div>
            <div className="flex justify-center gap-4 flex-wrap items-center"> 
                {/* --- CAMBIO: Se elimina el componente AnalysisFilters --- */}
                <Button onClick={() => handleStartAnalysis('pending')} disabled={isLoading || filteredCounts.pending === 0} variant="warning"> 
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} 
                    Analizar {filteredCounts.pending} Pendientes 
                </Button> 
            </div> 
            <div className="space-y-4"> 
                <div className="space-y-4 p-4 border bg-card rounded-lg">
                <div className="flex flex-col sm:flex-row gap-2 items-center"> 
                    <div className="relative w-full flex-grow"> 
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /> 
                        <Input 
                            type="search" 
                            placeholder="Buscar por interno, patente, tipo, chofer..." 
                            className="pl-10 h-10" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        /> 
                    </div> 
                </div> 
                </div> 
                <div> 
                    <ToggleGroup type="single" variant="outline" value={statusFilter} onValueChange={(value) => { if (value) setStatusFilter(value); }} className="flex flex-wrap justify-start">
                        {role !== 'USER' && (
                          <ToggleGroupItem value="all" className="flex items-center gap-2"><span>Todos</span><Badge variant="default">{filteredCounts.total}</Badge></ToggleGroupItem>
                        )}
                        <ToggleGroupItem value="pending" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.pending}</span><Badge variant={ALARM_STATUS_VARIANT.pending}>{filteredCounts.pending}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="suspicious" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.suspicious}</span><Badge variant={ALARM_STATUS_VARIANT.suspicious as any}>{filteredCounts.suspicious}</Badge></ToggleGroupItem>
                        {role !== 'USER' && (
                          <>
                            <ToggleGroupItem value="confirmed" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.confirmed}</span><Badge variant={ALARM_STATUS_VARIANT.confirmed}>{filteredCounts.confirmed}</Badge></ToggleGroupItem>
                            <ToggleGroupItem value="rejected" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.rejected}</span><Badge variant={ALARM_STATUS_VARIANT.rejected}>{filteredCounts.rejected}</Badge></ToggleGroupItem>
                          </>
                        )}
                    </ToggleGroup> 
                </div> 
            </div> 
            
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
            ) : error ? (
                <div className="p-4 text-center text-destructive col-span-full">{error}</div>
            ) : alarms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {alarms.map((alarm) => (<AlarmCard key={alarm.id} alarm={alarm} onClick={() => handleCardClick(alarm)} />))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground pt-10 col-span-full">
                    No se encontraron alarmas para los filtros seleccionados.
                </div>
            )}
            
            {paginationInfo && paginationInfo.totalPages > 1 && (<PaginationControls currentPage={currentPage} totalPages={paginationInfo.totalPages} onPageChange={setCurrentPage} />)}
            
            

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}> 
                <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col"> 
                    {alarmForDetails && ( 
                        <>
                            <DialogHeader className="p-6 pb-2 sr-only">
                                <DialogTitle>Detalles de Alarma: {alarmForDetails.type}</DialogTitle>
                                <DialogDescription>Información detallada y acciones para la alarma ID {alarmForDetails.id}.</DialogDescription>
                            </DialogHeader>
                            {isNavigating && ( 
                                <> 
                                    <Button variant="outline" size="icon" onClick={goToPrevious} disabled={!hasPrevious || isLoadingMore || isSubmitting} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full rounded-full h-12 w-12 bg-background/80 hover:bg-background z-50"><ChevronLeft className="h-6 w-6" /><span className="sr-only">Anterior</span></Button> 
                                    <Button variant="outline" size="icon" onClick={goToNext} disabled={!hasNext || isLoadingMore || isSubmitting} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full rounded-full h-12 w-12 bg-background/80 hover:bg-background z-50">{isLoadingMore ? <Loader2 className="h-6 w-6 animate-spin" /> : <ChevronRight className="h-6 w-6" />}<span className="sr-only">Siguiente</span></Button> 
                                </>
                            )} 
                            <div className="p-6 pt-0 overflow-y-auto flex-grow"> 
                                <AlarmDetails 
                                    alarm={alarmForDetails} 
                                    current={navigationState?.current} 
                                    total={navigationState?.total}
                                    onAction={handleDialogAction}
                                    onDriverReassign={handleDriverReassign}
                                    onAlarmUpdate={handleAlarmUpdate}
                                    isSubmitting={isSubmitting}
                                    showActions={
                            role === 'USER' 
                                ? alarmForDetails.status === 'pending'  // USER solo puede actuar sobre pendientes
                                : (alarmForDetails.status === 'pending' || alarmForDetails.status === 'suspicious' || alarmForDetails.status === 'rejected')  // Otros roles pueden actuar sobre más estados
                        }
                                /> 
                            </div> 
                        </> 
                    )} 
                </DialogContent> 
            </Dialog>
            
            <Dialog open={isAnalysisMode} onOpenChange={(open) => { if (!open) { fetchAlarms(); } setIsAnalysisMode(open); }}>
                <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-2 sm:p-4">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Modo Análisis de Alarmas</DialogTitle>
                        <DialogDescription>Vista enfocada para revisar alarmas una por una.</DialogDescription>
                    </DialogHeader>
                    {currentAnalysisAlarm ? (
                        <AlarmAnalysisView
                            alarm={currentAnalysisAlarm}
                            onAction={handleAnalysisAction}
                            onUndo={handleUndo}
                            isUndoDisabled={!lastProcessedAlarm || isSubmitting || isUndoing || isFetchingNextBatch}
                            isSubmitting={isSubmitting || isUndoing || isFetchingNextBatch}
                            current={analysisIndex + 1}
                            total={analysisTotalCount}
                            confirmText={confirmButtonText}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
                            <p className="text-muted-foreground mt-4">Cargando...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
