'use client'

import { useEffect, useState, useMemo, useCallback } from "react";
import { Alarm, PaginationInfo } from "@/types";
import { getAlarms, reviewAlarm, getPendingAlarmsForAnalysis, GetAlarmsParams } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlarmCard } from "./alarm-card";
import { AlarmDetails } from "./alarm-details";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, Bell, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { AlarmAnalysisView } from "./alarm-analysis-view";
import { AlarmReview } from "./alarm-review";
import { ALARM_STATUS_ES, ALARM_STATUS_ES_PLURAL, ALARM_STATUS_VARIANT } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdvancedFilters } from "./advanced-filters";
import { KPICard } from "./kpi-card";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "../ui/pagination-controls"; // Importamos el nuevo componente

// Hook personalizado para el debouncing
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export function AlarmsPage() {
    const { toast } = useToast();
    
    // --- ESTADOS PRINCIPALES ---
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- ESTADOS PARA FILTROS Y PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500); // Búsqueda con 500ms de retraso
    const [typeFilters, setTypeFilters] = useState<string[]>([]);

    // --- ESTADOS PARA MODALES Y ACCIONES SECUNDARIAS ---
    const [alarmForDetails, setAlarmForDetails] = useState<Alarm | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    // --- ESTADOS PARA EL MODO ANÁLISIS (se mantienen intactos) ---
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [analysisAlarms, setAnalysisAlarms] = useState<Alarm[]>([]);
    const [analysisIndex, setAnalysisIndex] = useState(0);
    const [analysisPage, setAnalysisPage] = useState(1);
    const [totalPending, setTotalPending] = useState(0);
    const [hasNextPageAnalysis, setHasNextPageAnalysis] = useState(false);
    const [isFetchingNextBatch, setIsFetchingNextBatch] = useState(false);

    // --- LÓGICA DE CARGA DE DATOS ---
    const fetchAlarms = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: GetAlarmsParams = {
                page: currentPage,
                status: statusFilter,
                search: debouncedSearchQuery,
            };
            const data = await getAlarms(params);
            setAlarms(data.alarms);
            setPaginationInfo(data.pagination);
        } catch (e) {
            setError("Error de conexión: No se pudieron cargar las alarmas.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, statusFilter, debouncedSearchQuery]);

    useEffect(() => {
        fetchAlarms();
    }, [fetchAlarms]);

    // Efecto para cargar el conteo de pendientes para el botón de "Análisis Rápido"
    useEffect(() => {
        getPendingAlarmsForAnalysis(1, 1).then(data => {
            setTotalPending(data.total);
        });
    }, []);

    // Reiniciar a la página 1 cuando se cambia un filtro
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, debouncedSearchQuery, typeFilters]);

    const uniqueAlarmTypes = useMemo(() => Array.from(new Set(alarms.map(a => a.type))), [alarms]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // --- LÓGICA DEL MODO ANÁLISIS (sin cambios significativos) ---
    const handleStartAnalysis = async () => {
        if (totalPending === 0) {
            toast({ title: "Sin alarmas pendientes", description: "¡Buen trabajo! No hay nada que analizar." });
            return;
        }
        setIsFetchingNextBatch(true);
        const pendingData = await getPendingAlarmsForAnalysis(1, 10);
        setAnalysisAlarms(pendingData.alarms);
        setTotalPending(pendingData.total);
        setHasNextPageAnalysis(pendingData.hasNextPage);
        setAnalysisPage(1);
        setAnalysisIndex(0);
        setIsFetchingNextBatch(false);

        if (pendingData.alarms.length > 0) setIsAnalysisMode(true);
    };
    
    const handleAnalysisAction = async (action: 'confirmed' | 'rejected' | 'skip') => {
        const currentAlarmInAnalysis = analysisAlarms[analysisIndex];
        if (!currentAlarmInAnalysis) return;

        if (action !== 'skip') {
            setIsSubmitting(true);
            try {
                await reviewAlarm(currentAlarmInAnalysis.id, action);
                setTotalPending(prev => Math.max(0, prev - 1));
                // Refrescamos la lista principal para que refleje el cambio
                fetchAlarms();
                toast({ title: "Alarma Actualizada" });
            } catch (err: any) {
                toast({ title: "Error", description: err.message || `No se pudo actualizar la alarma.`, variant: "destructive" });
            } finally {
                setIsSubmitting(false);
            }
        }
        setAnalysisIndex(prev => prev + 1);
    };

    const handleLoadNextBatch = async () => {
        if (!hasNextPageAnalysis) return;
        setIsFetchingNextBatch(true);
        const nextPage = analysisPage + 1;
        const pendingData = await getPendingAlarmsForAnalysis(nextPage, 10);
        setAnalysisAlarms(pendingData.alarms);
        setHasNextPageAnalysis(pendingData.hasNextPage);
        setAnalysisPage(nextPage);
        setAnalysisIndex(0);
        setIsFetchingNextBatch(false);
    };

    const isBatchComplete = analysisIndex >= analysisAlarms.length;

    // --- LÓGICA DEL DIÁLOGO DE DETALLES ---
    const handleDialogReview = async (status: 'confirmed' | 'rejected') => {
        if (!alarmForDetails) return;
        setIsSubmitting(true);
        try {
            await reviewAlarm(alarmForDetails.id, status);
            setTotalPending(prev => Math.max(0, prev - 1));
            // Refrescamos la lista principal
            fetchAlarms();
            toast({ title: "Alarma Actualizada" });
            setAlarmForDetails(null); 
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "No se pudo actualizar la alarma.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gestión de Alarmas</h1>
                <p className="text-muted-foreground">Revise, confirme o rechace las alarmas generadas por los dispositivos.</p>
            </div>
            
            {/* Las KPI Cards ahora podrían mostrar N/A o datos globales si se implementara un endpoint de estadísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Total de Alarmas (Vista Actual)" value={isLoading ? '...' : paginationInfo?.totalAlarms ?? 0} icon={<Bell className="h-4 w-4 text-muted-foreground" />} />
                <KPICard title="Alarmas Pendientes (Global)" value={isLoading ? '...' : totalPending} icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
                <KPICard title="Alarmas Confirmadas" value={"N/A"} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
                <KPICard title="Alarmas Rechazadas" value={"N/A"} icon={<XCircle className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <div className="text-center">
                <Button onClick={handleStartAnalysis} disabled={isLoading || isFetchingNextBatch || totalPending === 0}>
                    {isFetchingNextBatch && !isAnalysisMode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    Análisis Rápido ({totalPending} Pendientes)
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Buscar por patente, interno, tipo..." className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                     <AdvancedFilters availableTypes={uniqueAlarmTypes} selectedTypes={typeFilters} onSelectionChange={setTypeFilters} />
                </div>
                <div>
                    <ToggleGroup 
                        type="single" 
                        variant="outline" 
                        value={statusFilter} 
                        onValueChange={(value) => { if (value) setStatusFilter(value); }}
                        className="flex flex-wrap justify-start"
                    >
                        <ToggleGroupItem value="all">Todos</ToggleGroupItem>
                        <ToggleGroupItem value="pending">{ALARM_STATUS_ES_PLURAL.pending}</ToggleGroupItem>
                        <ToggleGroupItem value="confirmed">{ALARM_STATUS_ES_PLURAL.confirmed}</ToggleGroupItem>
                        <ToggleGroupItem value="rejected">{ALARM_STATUS_ES_PLURAL.rejected}</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
                : error ? <div className="p-4 text-center text-destructive col-span-full">{error}</div>
                : alarms.length > 0 ? alarms.map((alarm) => (
                    <AlarmCard key={alarm.id} alarm={alarm} onClick={() => setAlarmForDetails(alarm)} />
                ))
                : <div className="text-center text-muted-foreground pt-10 col-span-full">No se encontraron alarmas para los filtros seleccionados.</div>}
            </div>

            {/* Controles de paginación */}
            <div className="flex justify-center">
                {paginationInfo && <PaginationControls currentPage={currentPage} totalPages={paginationInfo.totalPages} onPageChange={handlePageChange} />}
            </div>
            
            {/* Diálogo de Detalles */}
            <Dialog open={!!alarmForDetails} onOpenChange={(open) => !open && setAlarmForDetails(null)}>
                <DialogContent className="max-w-4xl h-[90vh] grid grid-rows-[auto_1fr_auto] p-0 gap-0">
                    {alarmForDetails && (
                        <>
                            <DialogHeader className="p-6 border-b"><DialogTitle>Detalles de Alarma: {alarmForDetails.type}</DialogTitle></DialogHeader>
                            <div className="overflow-y-auto p-6"><AlarmDetails alarm={alarmForDetails} /></div>
                            {alarmForDetails.status === 'pending' && (
                                <DialogFooter className="p-6 border-t sm:justify-start">
                                    <div className="w-full"><AlarmReview onReview={handleDialogReview} isSubmitting={isSubmitting} /></div>
                                </DialogFooter>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
            
            {/* Diálogo de Análisis Rápido */}
            <Dialog open={isAnalysisMode} onOpenChange={setIsAnalysisMode}>
                <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-2 sm:p-4">
                    {!isBatchComplete && analysisAlarms[analysisIndex] ? (
                        <AlarmAnalysisView
                            alarm={analysisAlarms[analysisIndex]}
                            onAction={handleAnalysisAction}
                            isSubmitting={isSubmitting}
                            current={analysisIndex + 1}
                            total={analysisAlarms.length}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Lote Completado</h2>
                            <p className="text-muted-foreground mb-6">Has analizado un lote de alarmas.</p>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setIsAnalysisMode(false)}>Terminar</Button>
                                {hasNextPageAnalysis && (
                                    <Button onClick={handleLoadNextBatch} disabled={isFetchingNextBatch}>
                                        {isFetchingNextBatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Cargar 10 más
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AlarmsPage;