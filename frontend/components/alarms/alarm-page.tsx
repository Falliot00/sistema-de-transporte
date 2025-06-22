// frontend/components/alarms/alarm-page.tsx
'use client'

import { useEffect, useState, useCallback } from "react";
import { Alarm, PaginationInfo, GlobalAlarmCounts, GetAlarmsParams } from "@/types";
import { getAlarms, reviewAlarm, confirmAlarm, reEvaluateAlarm } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAlarmNavigation } from "@/hooks/use-alarm-navigation";
import { AlarmCard } from "./alarm-card";
import { AlarmDetails } from "./alarm-details";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, Bell, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
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
import { subDays } from "date-fns";

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

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

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
    } = useAlarmNavigation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
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
            const params: GetAlarmsParams = { 
                page: currentPage, 
                pageSize: 12, 
                status: statusFilter, 
                search: debouncedSearchQuery, 
                type: typeFilters,
                startDate: dateRange?.from?.toISOString(),
                endDate: dateRange?.to?.toISOString(),
            };
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
    }, [currentPage, statusFilter, debouncedSearchQuery, typeFilters, dateRange]);

    useEffect(() => { fetchAlarms(); }, [fetchAlarms]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter, debouncedSearchQuery, typeFilters, dateRange]);
    
    const handleCardClick = (clickedAlarm: Alarm) => {
        const navigableAlarms = alarms;
        const index = navigableAlarms.findIndex(a => a.id === clickedAlarm.id);
        initializeNavigation(navigableAlarms, index > -1 ? index : 0);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        resetNavigation();
    };

    const handleDialogAction = async (payload: { action: 'confirmed' | 'rejected', description: string, choferId?: number }) => {
        if (!alarmForDetails) return;
        
        const { action, description, choferId } = payload;
        const alarmIdToUpdate = alarmForDetails.id;
        setIsSubmitting(true);

        try {
            if (alarmForDetails.status === 'pending') {
                await reviewAlarm(alarmIdToUpdate, action, description, choferId);
            } else if (alarmForDetails.status === 'suspicious') {
                // --- INICIO DE LA SOLUCIÓN ---
                // Se corrige la validación para que acepte el ID de chofer 0.
                if (action === 'confirmed' && typeof choferId !== 'number') {
                    toast({ title: "Error de Validación", description: "Se requiere un chofer para confirmar la alarma.", variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }
                // --- FIN DE LA SOLUCIÓN ---
                if (action === 'confirmed') {
                    await confirmAlarm(alarmIdToUpdate, description, choferId);
                } else {
                    await reviewAlarm(alarmIdToUpdate, action, description, choferId);
                }
            }
            
            toast({ title: "Alarma Actualizada" });
            
            removeAlarm(alarmIdToUpdate);
            if (hasNext) {
                goToNext();
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

    const handleReEvaluate = async (payload: { action: 'confirmed' | 'rejected', description: string, choferId?: number }) => {
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
    
    const handleStartAnalysis = async (status: 'pending' | 'suspicious') => {
        const count = status === 'pending' ? globalAlarmCounts.pending : globalAlarmCounts.suspicious;
        if (count === 0) {
            toast({ title: `Sin alarmas ${status === 'pending' ? 'pendientes' : 'sospechosas'}`, description: "No hay nada que analizar en esta categoría." });
            return;
        }
        setIsFetchingNextBatch(true);
        setAnalysisType(status);
        try {
            const data = await getAlarms({ status, pageSize: 10 });
            setAnalysisAlarms(data.alarms);
            setHasNextPageAnalysis(data.pagination.hasNextPage);
            setAnalysisPage(1);
            setAnalysisIndex(0);
            if (data.alarms.length > 0) {
                setIsAnalysisMode(true);
            } else {
                toast({ title: "Sin alarmas", description: `No se encontraron alarmas para analizar en el estado '${status}'.`})
            }
        } catch (e) {
            toast({ title: "Error", description: "No se pudieron cargar las alarmas para el análisis.", variant: "destructive" });
        } finally {
            setIsFetchingNextBatch(false);
        }
    };
    
    const handleLoadNextBatch = async () => {
        if (!hasNextPageAnalysis || !analysisType) return;
        setIsFetchingNextBatch(true);
        const nextPage = analysisPage + 1;
        try {
            const data = await getAlarms({ status: analysisType, page: nextPage, pageSize: 10 });
            setAnalysisAlarms(data.alarms);
            setHasNextPageAnalysis(data.pagination.hasNextPage);
            setAnalysisPage(nextPage);
            setAnalysisIndex(0);
        } catch (e) {
             toast({ title: "Error", description: "No se pudo cargar el siguiente lote de alarmas.", variant: "destructive" });
        } finally {
            setIsFetchingNextBatch(false);
        }
    };

    const handleAnalysisAction = async (action: 'confirmed' | 'rejected' | 'skip') => {
        if (action === 'skip') {
            if (analysisIndex >= analysisAlarms.length - 1) {
                setAnalysisAlarms([]);
                if (hasNextPageAnalysis) {
                    handleLoadNextBatch();
                } else {
                    setIsAnalysisMode(false);
                    toast({title: "Análisis Completado", description: "Has revisado todas las alarmas disponibles."})
                }
            } else {
                setAnalysisIndex(prev => prev + 1);
            }
            return;
        }
        
        const currentAlarm = analysisAlarms[analysisIndex];
        if (!currentAlarm) return;
        
        setIsSubmitting(true);
        try {
            if (currentAlarm.status === 'pending') {
                await reviewAlarm(currentAlarm.id, action);
            } else if (currentAlarm.status === 'suspicious') {
                if (action === 'confirmed') {
                    await confirmAlarm(currentAlarm.id);
                } else {
                    await reviewAlarm(currentAlarm.id, action);
                }
            }
            toast({ title: "Alarma Actualizada" });

            if (analysisIndex >= analysisAlarms.length - 1) {
                setAnalysisAlarms([]);
                if (hasNextPageAnalysis) {
                    handleLoadNextBatch();
                } else {
                    setIsAnalysisMode(false);
                    toast({title: "Análisis Completado", description: "Has revisado todas las alarmas disponibles."})
                }
            } else {
                setAnalysisIndex(prev => prev + 1);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            fetchAlarms();
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
                <KPICard title="Total de Alarmas" value={isLoading ? '...' : globalAlarmCounts.total} icon={<Bell className="h-4 w-4" />} iconClassName="text-black-500"/>
                <KPICard title="Pendientes" value={isLoading ? '...' : globalAlarmCounts.pending} icon={<Clock className="h-4 w-4" />} iconClassName="text-yellow-500" />
                <KPICard title="Sospechosas" value={isLoading ? '...' : globalAlarmCounts.suspicious} icon={<AlertTriangle className="h-4 w-4" />} iconClassName="text-blue-500" />
                <KPICard title="Confirmadas" value={isLoading ? '...' : globalAlarmCounts.confirmed} icon={<CheckCircle className="h-4 w-4" />} iconClassName="text-green-500" />
                <KPICard title="Rechazadas" value={isLoading ? '...' : globalAlarmCounts.rejected} icon={<XCircle className="h-4 w-4" />} iconClassName="text-red-500" />
            </div>
            <div className="flex justify-center gap-4 flex-wrap">
                <Button onClick={() => handleStartAnalysis('pending')} disabled={isLoading || globalAlarmCounts.pending === 0} variant="warning">
                    <PlayCircle className="mr-2 h-4 w-4" /> Analizar {globalAlarmCounts.pending} alarmas pendientes
                </Button>
                <Button onClick={() => handleStartAnalysis('suspicious')} disabled={isLoading || globalAlarmCounts.suspicious === 0} variant="info">
                    <PlayCircle className="mr-2 h-4 w-4" /> Analizar {globalAlarmCounts.suspicious} alarmas sospechosas
                </Button>
            </div>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-1 justify-between items-center">
                    <div className="relative w-full flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Buscar por patente, interno, tipo..." className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex gap-2 items-center flex-wrap justify-end">
                        <AdvancedFilters availableTypes={alarmTypes} selectedTypes={typeFilters} onSelectionChange={setTypeFilters} />
                    </div>
                    <div className="flex gap-2 items-center flex-wrap justify-end">
                       <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    </div>
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
                    <AlarmCard key={alarm.id} alarm={alarm} onClick={() => handleCardClick(alarm)} />
                ))
                : <div className="text-center text-muted-foreground pt-10 col-span-full">No se encontraron alarmas para los filtros seleccionados.</div>}
            </div>
            
            {paginationInfo && paginationInfo.totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={paginationInfo.totalPages} onPageChange={setCurrentPage} />}
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
                 <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
                    {alarmForDetails && (
                        <>
                             {isNavigating && (
                                <>
                                    <Button variant="outline" size="icon" onClick={goToPrevious} disabled={!hasPrevious} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full rounded-full h-12 w-12 bg-background/80 hover:bg-background z-50">
                                        <ChevronLeft className="h-6 w-6" />
                                        <span className="sr-only">Anterior</span>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={goToNext} disabled={!hasNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full rounded-full h-12 w-12 bg-background/80 hover:bg-background z-50">
                                        <ChevronRight className="h-6 w-6" />
                                        <span className="sr-only">Siguiente</span>
                                    </Button>
                                </>
                            )}
                            
                            <div className="p-6 overflow-y-auto flex-grow">
                                <AlarmDetails alarm={alarmForDetails} />
                            </div>

                            {(alarmForDetails.status === 'pending' || alarmForDetails.status === 'suspicious' || alarmForDetails.status === 'rejected') && (
                                <DialogFooter className="p-6 border-t sm:justify-start bg-background">
                                    <div className="w-full">
                                        {(alarmForDetails.status === 'pending' || alarmForDetails.status === 'suspicious') && (
                                            <AlarmActionForm
                                                alarm={alarmForDetails}
                                                onAction={handleDialogAction}
                                                isSubmitting={isSubmitting}
                                                confirmText={alarmForDetails.status === 'pending' ? 'Marcar como Sospechosa' : 'Confirmar Alarma'}
                                                initialDescription={alarmForDetails.descripcion || ''}
                                                showDriverSelector={true}
                                            />
                                        )}
                                        {alarmForDetails.status === 'rejected' && (
                                            <AlarmActionForm
                                                alarm={alarmForDetails}
                                                onAction={handleReEvaluate}
                                                isSubmitting={isSubmitting}
                                                confirmText="Marcar como Sospechosa"
                                                rejectText="Mantener Rechazada"
                                                initialDescription={alarmForDetails.descripcion || ''}
                                                showDriverSelector={false}
                                            />
                                        )}
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
                            confirmText={confirmButtonText}
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