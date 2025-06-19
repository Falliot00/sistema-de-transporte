'use client'

import { useEffect, useState, useMemo, useCallback } from "react";
import { Alarm, PaginationInfo, GlobalAlarmCounts, GetAlarmsParams } from "@/types";
import { getAlarms, reviewAlarm, confirmAlarm } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlarmCard } from "./alarm-card";
import { AlarmDetails } from "./alarm-details";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, Bell, Clock, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { AlarmAnalysisView } from "./alarm-analysis-view";
import { AlarmReview } from "./alarm-review";
import { ALARM_STATUS_ES_PLURAL, ALARM_STATUS_VARIANT } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdvancedFilters } from "./advanced-filters";
import { KPICard } from "./kpi-card";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "../ui/pagination-controls";
import { alarmTypes } from "@/lib/mock-data"; // Importar la lista completa de alarmTypes

function useDebounce(value: string, delay: number): string {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

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

    const [alarmForDetails, setAlarmForDetails] = useState<Alarm | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [analysisAlarms, setAnalysisAlarms] = useState<Alarm[]>([]);
    const [analysisIndex, setAnalysisIndex] = useState(0);
    const [analysisPage, setAnalysisPage] = useState(1);
    const [hasNextPageAnalysis, setHasNextPageAnalysis] = useState(false);
    const [isFetchingNextBatch, setIsFetchingNextBatch] = useState(false);
    const [analysisType, setAnalysisType] = useState<'pending' | 'suspicious' | null>(null);

    const fetchAlarms = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: GetAlarmsParams = { page: currentPage, pageSize: 12, status: statusFilter, search: debouncedSearchQuery, type: typeFilters };
            const data = await getAlarms(params);
            setAlarms(data.alarms);
            setPaginationInfo(data.pagination);
            setGlobalAlarmCounts(data.globalCounts);
        } catch (e) {
            setError("Error de conexión: No se pudieron cargar las alarmas.");
            console.error(e);
            setAlarms([]);
            setPaginationInfo(null);
            setGlobalAlarmCounts({ total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, statusFilter, debouncedSearchQuery, typeFilters]);

    useEffect(() => { fetchAlarms(); }, [fetchAlarms]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter, debouncedSearchQuery, typeFilters]);

    // MODIFICADO: uniqueAlarmTypes ya no se usa, ahora se pasa la lista completa desde mock-data
    // const uniqueAlarmTypes = useMemo(() => Array.from(new Set(alarms.map(a => a.type))), [alarms]);

    const handleStartAnalysis = async (status: 'pending' | 'suspicious') => {
        const count = status === 'pending' ? globalAlarmCounts.pending : globalAlarmCounts.suspicious;
        if (count === 0) {
            toast({ title: `Sin alarmas ${status === 'pending' ? 'pendientes' : 'sospechosas'}`, description: "No hay nada que analizar en esta categoría." });
            return;
        }
        setIsFetchingNextBatch(true);
        setAnalysisType(status);
        const data = await getAlarms({ status, pageSize: 10 });
        setAnalysisAlarms(data.alarms);
        setHasNextPageAnalysis(data.pagination.hasNextPage);
        setAnalysisPage(1);
        setAnalysisIndex(0);
        setIsFetchingNextBatch(false);
        if (data.alarms.length > 0) setIsAnalysisMode(true);
    };

    const handleLoadNextBatch = async () => {
        if (!hasNextPageAnalysis || !analysisType) return;
        setIsFetchingNextBatch(true);
        const nextPage = analysisPage + 1;
        const data = await getAlarms({ status: analysisType, page: nextPage, pageSize: 10 });
        setAnalysisAlarms(data.alarms);
        setHasNextPageAnalysis(data.pagination.hasNextPage);
        setAnalysisPage(nextPage);
        setAnalysisIndex(0);
        setIsFetchingNextBatch(false);
    };

    const handleAnalysisAction = async (action: 'confirmed' | 'rejected' | 'skip') => {
        if (action === 'skip') {
            if (analysisIndex >= analysisAlarms.length - 1) {
                setAnalysisAlarms([]); 
            } else {
                setAnalysisIndex(prev => prev + 1);
            }
            return;
        }
        const currentAlarm = analysisAlarms[analysisIndex];
        if (!currentAlarm) return;
        setIsSubmitting(true);
        try {
            // CRITICAL SECURITY CHECK:
            // Ensure that the status update logic correctly reflects your business rules.
            // For 'pending' alarms, 'confirmed' action means marking as 'suspicious' in DB.
            // For 'suspicious' alarms, 'confirmed' action means marking as 'confirmed' in DB.
            if (currentAlarm.status === 'pending') {
                // When reviewing a 'pending' alarm, the 'confirmed' action means it becomes 'suspicious'
                await reviewAlarm(currentAlarm.id, action === 'confirmed' ? 'confirmed' : action); 
            } else if (currentAlarm.status === 'suspicious') {
                // When reviewing a 'suspicious' alarm, 'confirmed' means final confirmation
                if (action === 'confirmed') await confirmAlarm(currentAlarm.id);
                else await reviewAlarm(currentAlarm.id, action);
            }
            toast({ title: "Alarma Actualizada" });
            if (analysisIndex >= analysisAlarms.length - 1) {
                setAnalysisAlarms([]);
                setAnalysisIndex(0); // Reset index after processing all in current batch
                if (!hasNextPageAnalysis) {
                    setIsAnalysisMode(false); // Close analysis mode if no more pages
                } else {
                    handleLoadNextBatch(); // Load next batch if available
                }
            } else {
                setAnalysisIndex(prev => prev + 1);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            // Refresh main alarm list counts immediately after an action
            fetchAlarms();
        }
    };
    
    const handleDialogReview = async (action: 'confirmed' | 'rejected') => {
        if (!alarmForDetails) return;
        setIsSubmitting(true);
        try {
            // When reviewing a 'pending' alarm from details, 'confirmed' means it becomes 'suspicious'
            await reviewAlarm(alarmForDetails.id, action);
            toast({ title: "Alarma Actualizada" });
            fetchAlarms();
            setAlarmForDetails(null);
        } catch (error: any) {
            toast({ title: "Error", variant: "destructive", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFinalConfirmation = async () => {
        if (!alarmForDetails) return;
        setIsSubmitting(true);
        try {
            await confirmAlarm(alarmForDetails.id);
            toast({ title: "Alarma Confirmada" });
            fetchAlarms();
            setAlarmForDetails(null);
        } catch (error: any) {
            toast({ title: "Error", variant: "destructive", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Lógica para determinar el texto del botón "confirmar" en el modo de análisis
    const currentAnalysisAlarm = analysisAlarms[analysisIndex];
    let confirmButtonText = "Confirmar"; 
    if (currentAnalysisAlarm) {
        if (currentAnalysisAlarm.status === 'pending') {
            confirmButtonText = "Marcar como Sospechosa";
        } else if (currentAnalysisAlarm.status === 'suspicious') {
            confirmButtonText = "Confirmar";
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gestión de Alarmas</h1>
                <p className="text-muted-foreground">Revise, confirme o rechace las alarmas generadas por los dispositivos.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <KPICard title="Total de Alarmas" value={isLoading ? '...' : globalAlarmCounts.total} icon={<Bell className="h-4 w-4" />} iconClassName="text-black-500"/>
                <KPICard title="Pendientes" value={isLoading ? '...' : globalAlarmCounts.pending} icon={<Clock className="h-4 w-4" />} iconClassName="text-yellow-500" />
                <KPICard title="Sospechosas" value={isLoading ? '...' : globalAlarmCounts.suspicious} icon={<AlertTriangle className="h-4 w-4" />} iconClassName="text-blue-500" />
                <KPICard title="Confirmadas" value={isLoading ? '...' : globalAlarmCounts.confirmed} icon={<CheckCircle className="h-4 w-4" />} iconClassName="text-green-500" />
                <KPICard title="Rechazadas" value={isLoading ? '...' : globalAlarmCounts.rejected} icon={<XCircle className="h-4 w-4" />} iconClassName="text-red-500" />
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
                <Button onClick={() => handleStartAnalysis('pending')} disabled={isLoading || globalAlarmCounts.pending === 0} variant="warning">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Analizar {globalAlarmCounts.pending} alarmas pendientes
                </Button>
                <Button onClick={() => handleStartAnalysis('suspicious')} disabled={isLoading || globalAlarmCounts.suspicious === 0} variant="info">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Analizar {globalAlarmCounts.suspicious} alarmas sospechosas
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Buscar por patente, interno, tipo..." className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    {/* MODIFICADO: Pasar la lista completa de alarmTypes a AdvancedFilters */}
                    <AdvancedFilters availableTypes={alarmTypes} selectedTypes={typeFilters} onSelectionChange={setTypeFilters} />
                </div>
                <div>
                    <ToggleGroup type="single" variant="outline" value={statusFilter} onValueChange={(value) => { if (value) setStatusFilter(value); }} className="flex flex-wrap justify-start">
                        <ToggleGroupItem value="all" className="flex items-center gap-2"><span>Todos</span><Badge variant="default">{globalAlarmCounts.total}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="pending" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.pending}</span><Badge variant={ALARM_STATUS_VARIANT.pending}>{globalAlarmCounts.pending}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="suspicious" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.suspicious}</span><Badge variant={ALARM_STATUS_VARIANT.suspicious as any}>{globalAlarmCounts.suspicious}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="confirmed" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.confirmed}</span><Badge variant={ALARM_STATUS_VARIANT.confirmed}>{globalAlarmCounts.confirmed}</Badge></ToggleGroupItem>
                        <ToggleGroupItem value="rejected" className="flex items-center gap-2"><span>{ALARM_STATUS_ES_PLURAL.rejected}</span><Badge variant={ALARM_STATUS_VARIANT.rejected}>{globalAlarmCounts.rejected}</Badge></ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
                : error ? <div className="p-4 text-center text-destructive col-span-full">{error}</div>
                : alarms.length > 0 ? alarms.map((alarm) => (
                    <AlarmCard key={alarm.id} alarm={alarm} onClick={() => setAlarmForDetails(alarm)} />
                ))
                : <div className="text-center text-muted-foreground pt-10 col-span-full">No se encontraron alarmas para los filtros seleccionados.</div>}
            </div>
            
            {paginationInfo && <PaginationControls currentPage={currentPage} totalPages={paginationInfo.totalPages} onPageChange={setCurrentPage} />}
            
            <Dialog open={!!alarmForDetails} onOpenChange={(open) => !open && setAlarmForDetails(null)}>
                <DialogContent className="max-w-4xl h-[90vh] grid grid-rows-[auto_1fr_auto] p-0 gap-0">
                    {alarmForDetails && (
                        <>
                            <DialogHeader className="p-6 border-b"><DialogTitle>Detalles de Alarma: {alarmForDetails.type}</DialogTitle></DialogHeader>
                            <div className="overflow-y-auto p-6"><AlarmDetails alarm={alarmForDetails} /></div>
                            {(alarmForDetails.status === 'pending' || alarmForDetails.status === 'suspicious') && (
                                <DialogFooter className="p-6 border-t sm:justify-start">
                                    <div className="w-full">
                                        {alarmForDetails.status === 'pending' && <AlarmReview onReview={handleDialogReview} isSubmitting={isSubmitting} confirmText="Sospechosa" />}
                                        {alarmForDetails.status === 'suspicious' && <AlarmReview onReview={(action) => action === 'confirmed' ? handleFinalConfirmation() : handleDialogReview(action)} isSubmitting={isSubmitting} confirmText="Confirmar" />}
                                    </div>
                                </DialogFooter>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
            
            <Dialog open={isAnalysisMode} onOpenChange={(open) => { if (!open) fetchAlarms(); setIsAnalysisMode(open); }}>
                <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-2 sm:p-4">
                    {currentAnalysisAlarm ? (
                        <AlarmAnalysisView
                            alarm={currentAnalysisAlarm}
                            onAction={handleAnalysisAction}
                            isSubmitting={isSubmitting}
                            current={analysisIndex + 1}
                            total={analysisAlarms.length}
                            confirmText={confirmButtonText} // Se pasa la prop con el texto correcto
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Lote Completado</h2>
                            <p className="text-muted-foreground mb-6">Has analizado todas las alarmas de este lote.</p>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => { setIsAnalysisMode(false); fetchAlarms(); }}>Terminar</Button>
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