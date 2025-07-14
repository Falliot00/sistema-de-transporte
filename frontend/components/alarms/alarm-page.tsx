// frontend/components/alarms/alarm-page.tsx
'use client'

import { useEffect, useState, useCallback } from "react";
import { Alarm, PaginationInfo, GlobalAlarmCounts, GetAlarmsParams } from "@/types";
import { getAlarms, reviewAlarm, confirmAlarm, reEvaluateAlarm, getAlarmsCount, undoAlarm } from "@/lib/api";
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
import { AlarmActionForm } from "./alarm-action-form";
import { ALARM_STATUS_ES_PLURAL, ALARM_STATUS_VARIANT } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdvancedFilters } from "./advanced-filters";
import { KPICard } from "./kpi-card";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "../ui/pagination-controls";
import { alarmTypes } from "@/lib/mock-data";
import { DateRangePicker } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { AnalysisFilters } from "./analysis-filters";

function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const AVAILABLE_COMPANIES = ['LagunaPaiva', 'MonteVera'];
const ANALYSIS_PAGE_SIZE = 50;
const ANALYSIS_PRELOAD_PAGES = 3;

type AnalysisFilterState = {
    types: string[];
    companies: string[];
    dateRange?: DateRange;
};

export default function AlarmsPage() {
    const { toast } = useToast();
    
    const [globalAlarmCounts, setGlobalAlarmCounts] = useState<GlobalAlarmCounts>({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [companyFilters, setCompanyFilters] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const [analysisFilters, setAnalysisFilters] = useState<AnalysisFilterState>({ types: [], companies: [], dateRange: undefined });
    const [analysisCounts, setAnalysisCounts] = useState<{ pending: number, suspicious: number }>({ pending: 0, suspicious: 0 });
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);
    
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
        navigationState 
    } = useAlarmNavigation((error) => {
        toast({ title: "Error", description: error, variant: "destructive" });
    });
    
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

    const [filteredCounts, setFilteredCounts] = useState<GlobalAlarmCounts>({ 
        total: 0, 
        pending: 0, 
        suspicious: 0, 
        confirmed: 0, 
        rejected: 0 
    });

    const fetchAlarms = useCallback(async () => { 
        setIsLoading(true); 
        setError(null); 
        try { 
            const params: GetAlarmsParams = { 
                page: currentPage, 
                pageSize: 12, 
                status: statusFilter, 
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
            
            if (statusFilter === 'all') {
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
                    getAlarmsCount({ ...baseParams, status: 'confirmed' }),
                    getAlarmsCount({ ...baseParams, status: 'rejected' })
                ]);
                
                setFilteredCounts({
                    total: data.pagination.totalAlarms,
                    pending: pendingCount.count,
                    suspicious: suspiciousCount.count,
                    confirmed: confirmedCount.count,
                    rejected: rejectedCount.count
                });
            } else {
                setFilteredCounts({
                    total: data.pagination.totalAlarms,
                    pending: statusFilter === 'pending' ? data.pagination.totalAlarms : 0,
                    suspicious: statusFilter === 'suspicious' ? data.pagination.totalAlarms : 0,
                    confirmed: statusFilter === 'confirmed' ? data.pagination.totalAlarms : 0,
                    rejected: statusFilter === 'rejected' ? data.pagination.totalAlarms : 0,
                });
            }
        } catch (e) { 
            setError("Error de conexión: No se pudieron cargar las alarmas."); 
            setAlarms([]); 
            setPaginationInfo(null); 
            setGlobalAlarmCounts({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });
            setFilteredCounts({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });
        } finally { 
            setIsLoading(false); 
        } 
    }, [currentPage, statusFilter, debouncedSearchQuery, typeFilters, companyFilters, dateRange]);

    const fetchAnalysisCounts = useCallback(async () => { 
        setIsLoadingCounts(true); 
        try { 
            const commonParams: GetAlarmsParams = { 
                type: analysisFilters.types, 
                company: analysisFilters.companies, 
                startDate: analysisFilters.dateRange?.from?.toISOString(), 
                endDate: analysisFilters.dateRange?.to?.toISOString(), 
            }; 
            const [pendingData, suspiciousData] = await Promise.all([ 
                getAlarmsCount({ ...commonParams, status: 'pending' }), 
                getAlarmsCount({ ...commonParams, status: 'suspicious' }) 
            ]); 
            setAnalysisCounts({ pending: pendingData.count, suspicious: suspiciousData.count }); 
        } catch (e) { 
            console.error("Error al obtener conteos de análisis", e); 
            setAnalysisCounts({ pending: 0, suspicious: 0 }); 
        } finally { 
            setIsLoadingCounts(false); 
        } 
    }, [analysisFilters]);

    useEffect(() => { fetchAlarms(); }, [fetchAlarms]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter, debouncedSearchQuery, typeFilters, companyFilters, dateRange]);
    useEffect(() => { fetchAnalysisCounts(); }, [fetchAnalysisCounts]);

    const handleStartAnalysis = async (status: 'pending' | 'suspicious') => {
        const count = status === 'pending' ? analysisCounts.pending : analysisCounts.suspicious;
        if (count === 0) { 
            toast({ title: "Sin alarmas para analizar", description: "No hay alarmas que coincidan con los filtros seleccionados." }); 
            return; 
        }
        
        setIsFetchingNextBatch(true);
        setAnalysisType(status);
        
        try {
            setAnalysisTotalCount(count);
            const params: GetAlarmsParams = { 
                status, 
                pageSize: ANALYSIS_PAGE_SIZE, 
                type: analysisFilters.types, 
                company: analysisFilters.companies, 
                startDate: analysisFilters.dateRange?.from?.toISOString(), 
                endDate: analysisFilters.dateRange?.to?.toISOString(), 
            };
            
            const allAlarms: Alarm[] = [];
            let currentHasNext: boolean = true;
            
            for (let page = 1; page <= ANALYSIS_PRELOAD_PAGES && currentHasNext; page++) {
                const data = await getAlarms({ ...params, page });
                allAlarms.push(...data.alarms);
                currentHasNext = data.pagination.hasNextPage;
                if (page === 1 && data.alarms.length > 0) {
                    setAnalysisAlarms(allAlarms);
                    setHasNextPageAnalysis(currentHasNext as boolean);
                    setAnalysisPage(page);
                    setAnalysisIndex(0);
                    setLastProcessedAlarm(null);
                    setIsAnalysisMode(true);
                    if (page < ANALYSIS_PRELOAD_PAGES && currentHasNext) {
                        continue;
                    }
                }
            }
            
            if (allAlarms.length > 0) {
                setAnalysisAlarms(allAlarms);
                setHasNextPageAnalysis(currentHasNext as boolean);
                setAnalysisPage(Math.min(ANALYSIS_PRELOAD_PAGES, Math.ceil(allAlarms.length / ANALYSIS_PAGE_SIZE)));
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
        
        initializeNavigation(
            navigableAlarms, 
            index > -1 ? index : 0, 
            {
                status: statusFilter,
                search: debouncedSearchQuery,
                type: typeFilters,
                company: companyFilters,
                startDate: dateRange?.from?.toISOString(),
                endDate: dateRange?.to?.toISOString(),
                pageSize: 12,
                hasMorePages: !!paginationInfo?.hasNextPage,
                currentPage: currentPage,
                totalAlarms: paginationInfo?.totalAlarms || alarms.length
            }
        );
        
        setIsDialogOpen(true); 
    };

    const handleDialogClose = () => { 
        setIsDialogOpen(false); 
        resetNavigation(); 
    };

    // SOLUCIÓN: La firma de la función ahora acepta 'null' para choferId
    const handleDialogAction = async (payload: { action: 'confirmed' | 'rejected', description: string, choferId?: number | null }) => { 
        if (!alarmForDetails) return; 
        
        const { action, description, choferId } = payload; 
        const alarmIdToUpdate = alarmForDetails.id; 
        
        setIsSubmitting(true); 
        
        try { 
            if (alarmForDetails.status === 'pending') { 
                await reviewAlarm(alarmIdToUpdate, action, description, choferId ?? undefined); 
            } else if (alarmForDetails.status === 'suspicious') { 
                if (action === 'confirmed' && (choferId === null || choferId === undefined)) { 
                    toast({ title: "Error de Validación", description: "Se requiere un chofer para confirmar la alarma.", variant: "destructive" }); 
                    setIsSubmitting(false); 
                    return; 
                } 
                if (action === 'confirmed') { 
                    await confirmAlarm(alarmIdToUpdate, description, choferId as number); 
                } else { 
                    await reviewAlarm(alarmIdToUpdate, action, description, choferId ?? undefined); 
                } 
            } 
            
            toast({ title: "Alarma Actualizada" }); 
            removeAlarm(alarmIdToUpdate); 
            
            if (hasNext) { 
                await goToNext();
            } else if (hasPrevious) { 
                goToPrevious(); 
            } else { 
                handleDialogClose(); 
            } 
            
            fetchAlarms(); 
            fetchAnalysisCounts(); 
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
            fetchAnalysisCounts(); 
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
                type: analysisFilters.types, 
                company: analysisFilters.companies, 
                startDate: analysisFilters.dateRange?.from?.toISOString(), 
                endDate: analysisFilters.dateRange?.to?.toISOString(), 
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
                setAnalysisAlarms(newAlarms);
                setHasNextPageAnalysis(currentHasNext);
                setAnalysisIndex(0);
                setLastProcessedAlarm(null);
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
                } else if (currentAlarm.status === 'suspicious') { 
                    updatedAlarm = action === 'confirmed' 
                        ? await confirmAlarm(currentAlarm.id) 
                        : await reviewAlarm(currentAlarm.id, action); 
                } else { 
                    updatedAlarm = currentAlarm; 
                }
                const newAlarms = [...analysisAlarms]; 
                newAlarms[analysisIndex] = updatedAlarm; 
                setAnalysisAlarms(newAlarms);
                toast({ title: "Alarma Actualizada" });
                fetchAlarms(); 
                fetchAnalysisCounts();
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
            toast({ 
                title: "Acción deshecha", 
                description: `La alarma "${revertedAlarm.type}" fue restaurada a pendiente.`, 
            }); 
            fetchAnalysisCounts(); 
            fetchAlarms(); 
        } catch (error: any) { 
            toast({ title: "Error al deshacer", description: error.message, variant: "destructive" }); 
        } finally { 
            setIsUndoing(false); 
        } 
    };

    const currentAnalysisAlarm = analysisAlarms[analysisIndex];
    let confirmButtonText = "Confirmar"; 
    if (currentAnalysisAlarm?.status === 'pending') {
        confirmButtonText = "Sospechosa";
    }

    return (
        <div className="space-y-6">
            <div> 
                <h1 className="text-3xl font-bold">Gestión de Alarmas</h1> 
                <p className="text-muted-foreground">Revise, confirme o rechace las alarmas generadas por los dispositivos.</p> 
            </div> 
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KPICard title="Total de alarmas" value={isLoading ? '...' : globalAlarmCounts.total.toLocaleString()} icon={<Bell className="h-4 w-4" />} iconClassName="text-black-500"/>
                <KPICard title="Total de pendientes" value={isLoading ? '...' : globalAlarmCounts.pending.toLocaleString()} icon={<Clock className="h-4 w-4" />} iconClassName="text-yellow-500" />
                <KPICard title="Total de sospechosas" value={isLoading ? '...' : globalAlarmCounts.suspicious.toLocaleString()} icon={<AlertTriangle className="h-4 w-4" />} iconClassName="text-blue-500" />
                <KPICard title="Total de confirmadas" value={isLoading ? '...' : globalAlarmCounts.confirmed.toLocaleString()} icon={<CheckCircle className="h-4 w-4" />} iconClassName="text-green-500" />
                <KPICard title="Total de rechazadas" value={isLoading ? '...' : globalAlarmCounts.rejected.toLocaleString()} icon={<XCircle className="h-4 w-4" />} iconClassName="text-red-500" />
            </div>
            <div className="flex justify-center gap-4 flex-wrap items-center"> 
                <AnalysisFilters availableTypes={alarmTypes} availableCompanies={AVAILABLE_COMPANIES} filters={analysisFilters} onFilterChange={setAnalysisFilters} isLoading={isLoadingCounts} /> 
                <Button onClick={() => handleStartAnalysis('pending')} disabled={isLoadingCounts || analysisCounts.pending === 0} variant="warning"> 
                    {isLoadingCounts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} 
                    Analizar {analysisCounts.pending} Pendientes 
                </Button> 
            </div> 
            <div className="space-y-4"> 
                <div className="flex flex-col sm:flex-row gap-1 justify-between items-center"> 
                    <div className="relative w-full flex-grow"> 
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /> 
                        <Input type="search" placeholder="Buscar por interno, tipo, chofer..." className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /> 
                    </div> 
                    <div className="flex gap-2 items-center flex-wrap justify-end"> 
                        <AdvancedFilters availableTypes={alarmTypes} selectedTypes={typeFilters} onTypeSelectionChange={setTypeFilters} availableCompanies={AVAILABLE_COMPANIES} selectedCompanies={companyFilters} onCompanySelectionChange={setCompanyFilters} /> 
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} /> 
                    </div> 
                </div> 
                <div> 
                    <ToggleGroup type="single" variant="outline" value={statusFilter} onValueChange={(value) => { if (value) setStatusFilter(value); }} className="flex flex-wrap justify-start">
                        <ToggleGroupItem value="all" className="flex items-center gap-2"><span>Todos</span><Badge variant="default">{filteredCounts.total}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="pending" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.pending}</span><Badge variant={ALARM_STATUS_VARIANT.pending}>{filteredCounts.pending}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="suspicious" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.suspicious}</span><Badge variant={ALARM_STATUS_VARIANT.suspicious as any}>{filteredCounts.suspicious}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="confirmed" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.confirmed}</span><Badge variant={ALARM_STATUS_VARIANT.confirmed}>{filteredCounts.confirmed}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="rejected" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.rejected}</span><Badge variant={ALARM_STATUS_VARIANT.rejected}>{filteredCounts.rejected}</Badge></ToggleGroupItem>
                    </ToggleGroup> 
                </div> 
            </div> 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> 
                {isLoading ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />) : error ? <div className="p-4 text-center text-destructive col-span-full">{error}</div> : alarms.length > 0 ? alarms.map((alarm) => (<AlarmCard key={alarm.id} alarm={alarm} onClick={() => handleCardClick(alarm)} /> )) : <div className="text-center text-muted-foreground pt-10 col-span-full">No se encontraron alarmas para los filtros seleccionados.</div>} 
            </div>
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
                                <AlarmDetails alarm={alarmForDetails} current={navigationState?.current} total={navigationState?.total} /> 
                            </div> 
                            {(alarmForDetails.status === 'pending' || alarmForDetails.status === 'suspicious' || alarmForDetails.status === 'rejected') && ( 
                                <DialogFooter className="p-6 border-t sm:justify-start bg-background"> 
                                    <div className="w-full"> 
                                        {(alarmForDetails.status === 'pending' || alarmForDetails.status === 'suspicious') && (<AlarmActionForm alarm={alarmForDetails} onAction={handleDialogAction} isSubmitting={isSubmitting} confirmText={alarmForDetails.status === 'pending' ? 'Marcar como Sospechosa' : 'Confirmar Alarma'} initialDescription={alarmForDetails.descripcion || ''} showDriverSelector={true} /> )} 
                                        {alarmForDetails.status === 'rejected' && (<AlarmActionForm alarm={alarmForDetails} onAction={handleReEvaluate} isSubmitting={isSubmitting} confirmText="Marcar como Sospechosa" rejectText="Mantener Rechazada" initialDescription={alarmForDetails.descripcion || ''} showDriverSelector={false} /> )} 
                                    </div> 
                                </DialogFooter> 
                            )} 
                        </> 
                    )} 
                </DialogContent> 
            </Dialog>
            
            <Dialog open={isAnalysisMode} onOpenChange={(open) => { if (!open) { fetchAlarms(); fetchAnalysisCounts(); } setIsAnalysisMode(open); }}>
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