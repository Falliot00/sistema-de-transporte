'use client'

import { useEffect, useState, useMemo } from "react";
import { Alarm } from "@/types";
import { getAlarms, reviewAlarm } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlarmCard } from "./alarm-card";
import { AlarmDetails } from "./alarm-details";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayCircle, Search, Bell, Clock, CheckCircle, XCircle } from "lucide-react";
import { AlarmAnalysisView } from "./alarm-analysis-view";
import { AlarmReview } from "./alarm-review";
import { ALARM_STATUS_ES, ALARM_STATUS_ES_PLURAL } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AdvancedFilters } from "./advanced-filters";
import { KPICard } from "./kpi-card";

export function AlarmsPage() {
    const { toast } = useToast();
    
    const [masterAlarms, setMasterAlarms] = useState<Alarm[]>([]);
    const [alarmForDetails, setAlarmForDetails] = useState<Alarm | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [isAnalysisMode, setIsAnalysisMode] = useState(false);
    const [analysisIndex, setAnalysisIndex] = useState(0);

    const alarmCounts = useMemo(() => {
        const currentTotal = masterAlarms.length;
        return {
            total: currentTotal,
            pending: masterAlarms.filter(a => a.status === 'pending').length,
            confirmed: masterAlarms.filter(a => a.status === 'confirmed').length,
            rejected: masterAlarms.filter(a => a.status === 'rejected').length,
        };
    }, [masterAlarms]);

    const pendingAlarms = useMemo(() => 
        masterAlarms.filter(alarm => alarm.status === 'pending')
    , [masterAlarms]);

    const uniqueAlarmTypes = useMemo(() => 
        Array.from(new Set(masterAlarms.map(a => a.type)))
    , [masterAlarms]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getAlarms(); 
                setMasterAlarms(data);
            } catch (e) {
                setError("Error de conexión: No se pudieron cargar las alarmas.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (isAnalysisMode && analysisIndex >= pendingAlarms.length) {
            setIsAnalysisMode(false);
            toast({ title: "Análisis completado", description: "Has revisado todas las alarmas pendientes." });
        }
    }, [pendingAlarms, analysisIndex, isAnalysisMode, toast]);

    const filteredAlarms = useMemo(() => {
        let alarmsToFilter = [...masterAlarms];
        if (statusFilter !== "all") {
            alarmsToFilter = alarmsToFilter.filter((alarm) => alarm.status === statusFilter);
        }
        if (typeFilters.length > 0) {
            alarmsToFilter = alarmsToFilter.filter((alarm) => typeFilters.includes(alarm.type));
        }
        if (searchQuery.trim() !== "") {
            const lowercasedQuery = searchQuery.toLowerCase();
            alarmsToFilter = alarmsToFilter.filter((alarm) => {
                const statusLabel = ALARM_STATUS_ES[alarm.status]?.toLowerCase() || '';
                return (
                    alarm.type.toLowerCase().includes(lowercasedQuery) ||
                    statusLabel.includes(lowercasedQuery) ||
                    alarm.driver.name.toLowerCase().includes(lowercasedQuery) ||
                    alarm.vehicle.licensePlate.toLowerCase().includes(lowercasedQuery)
                );
            });
        }
        return alarmsToFilter;
    }, [masterAlarms, statusFilter, searchQuery, typeFilters]);
    
    const handleAnalysisAction = async (action: 'confirmed' | 'rejected' | 'skip') => {
        const currentAlarm = pendingAlarms[analysisIndex];
        if (!currentAlarm) return;
        
        const advanceToNextAlarm = () => {
             if (analysisIndex < pendingAlarms.length - 1) {
                setAnalysisIndex(prevIndex => prevIndex + 1);
            } else {
                setIsAnalysisMode(false);
                toast({ title: "Análisis completado" });
            }
        };

        if (action === 'skip') { advanceToNextAlarm(); return; }

        setIsSubmitting(true);
        try {
            const updatedAlarm = await reviewAlarm(currentAlarm.id, action);
            setMasterAlarms(currentAlarms => currentAlarms.map(a => (a.id === updatedAlarm.id ? updatedAlarm : a)));
        } catch (err) {
            toast({ title: "Error", description: `No se pudo actualizar la alarma.`, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDialogReview = async (status: 'confirmed' | 'rejected') => {
        if (!alarmForDetails) return;
        setIsSubmitting(true);
        try {
            const updatedAlarm = await reviewAlarm(alarmForDetails.id, status);
            setMasterAlarms(currentAlarms => currentAlarms.map(a => (a.id === updatedAlarm.id ? updatedAlarm : a)));
            toast({ title: "Alarma Actualizada" });
            setAlarmForDetails(null); 
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar la alarma.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartAnalysis = () => {
        if (pendingAlarms.length > 0) { setAnalysisIndex(0); setIsAnalysisMode(true); } 
        else { toast({ title: "Sin alarmas pendientes" }); }
    };

    const handleCardClick = (alarm: Alarm) => { setAlarmForDetails(alarm); };
    const handleDialogClose = (open: boolean) => { if (!open) setAlarmForDetails(null); };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Gestión de Alarmas</h1>
                <p className="text-muted-foreground">Revise, confirme o rechace las alarmas generadas por los dispositivos.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Total de Alarmas" value={isLoading ? '...' : alarmCounts.total} icon={<Bell className="h-4 w-4 text-muted-foreground" />} />
                <KPICard title="Alarmas Pendientes" value={isLoading ? '...' : alarmCounts.pending} icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
                <KPICard title="Alarmas Sospechosas" value={isLoading ? '...' : alarmCounts.confirmed} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
                <KPICard title="Alarmas Descartadas" value={isLoading ? '...' : alarmCounts.rejected} icon={<XCircle className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <div className="text-center">
                 <Button onClick={handleStartAnalysis} disabled={isLoading || pendingAlarms.length === 0}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Analizar {pendingAlarms.length} alarmas pendientes
                </Button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Buscar por chofer, patente, tipo..." className="pl-10 h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex-shrink-0">
                        <AdvancedFilters availableTypes={uniqueAlarmTypes} selectedTypes={typeFilters} onSelectionChange={setTypeFilters} />
                    </div>
                </div>
                <div>
                    <ToggleGroup type="single" variant="outline" value={statusFilter} onValueChange={(value) => { if (value) setStatusFilter(value); }}>
                        <ToggleGroupItem value="all">Todos ({alarmCounts.total})</ToggleGroupItem>
                        <ToggleGroupItem value="pending">{ALARM_STATUS_ES_PLURAL.pending} ({alarmCounts.pending})</ToggleGroupItem>
                        <ToggleGroupItem value="confirmed">{ALARM_STATUS_ES_PLURAL.confirmed} ({alarmCounts.confirmed})</ToggleGroupItem>
                        <ToggleGroupItem value="rejected">{ALARM_STATUS_ES_PLURAL.rejected} ({alarmCounts.rejected})</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {isLoading ? Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
                : error ? <div className="p-4 text-center text-destructive col-span-full">{error}</div>
                : filteredAlarms.length > 0 ? filteredAlarms.map((alarm) => (
                    <AlarmCard key={alarm.id} alarm={alarm} onClick={() => handleCardClick(alarm)} />
                ))
                : <div className="text-center text-muted-foreground pt-10 col-span-full">No hay alarmas para la selección actual.</div>}
            </div>
            
            {/* El código de los modales no ha cambiado */}
            <Dialog open={!!alarmForDetails} onOpenChange={handleDialogClose}>
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
            <Dialog open={isAnalysisMode} onOpenChange={setIsAnalysisMode}>
                <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-2 sm:p-4">
                    {isAnalysisMode && pendingAlarms[analysisIndex] && (
                        <AlarmAnalysisView
                            alarm={pendingAlarms[analysisIndex]}
                            onAction={handleAnalysisAction}
                            isSubmitting={isSubmitting}
                            current={analysisIndex + 1}
                            total={pendingAlarms.length}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AlarmsPage;