// frontend/components/drivers/recent-alarms-table.tsx
"use client";

import { useEffect, useMemo, useState } from 'react';
import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAlarmStatusInfo, formatCorrectedTimestamp } from "@/lib/utils";
import { History, Eye, Download, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlarmDetails } from '@/components/alarms/alarm-details';
import { Skeleton } from '@/components/ui/skeleton';
import { generateAlarmReport } from "@/lib/api";

interface RecentAlarmsTableProps {
    alarms: Alarm[];
    isLoading?: boolean;
    onReportGenerated?: () => void | Promise<void>;
}

type AlarmStatusFilter =
    | "all"
    | "confirmed"
    | "rejected"
    | "reported"
    | "confirmed_not_reported"
    | "suspicious";

const STATUS_FILTER_OPTIONS: Array<{ value: AlarmStatusFilter; label: string }> = [
    { value: "all", label: "Todas" },
    { value: "confirmed", label: "Confirmada" },
    { value: "rejected", label: "Rechazada" },
    { value: "reported", label: "Informada" },
    { value: "confirmed_not_reported", label: "Confirmadas sin informar" },
    { value: "suspicious", label: "Sospechosa" },
];

export function RecentAlarmsTable({ alarms, isLoading = false, onReportGenerated }: RecentAlarmsTableProps) {
    const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
    const [selectedAlarmIds, setSelectedAlarmIds] = useState<string[]>([]);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [statusFilter, setStatusFilter] = useState<AlarmStatusFilter>("all");

    const filteredAlarms = useMemo(() => {
        return alarms.filter((alarm) => {
            switch (statusFilter) {
                case "confirmed":
                    return alarm.status === "confirmed";
                case "rejected":
                    return alarm.status === "rejected";
                case "reported":
                    return alarm.informada === true;
                case "confirmed_not_reported":
                    return alarm.status === "confirmed" && alarm.informada === false;
                case "suspicious":
                    return alarm.status === "suspicious";
                case "all":
                default:
                    return true;
            }
        });
    }, [alarms, statusFilter]);

    // Alarmas confirmadas sin informar disponibles para generar informes.
    const reportableAlarms = useMemo(() => {
        return filteredAlarms.filter((alarm) => alarm.status === 'confirmed' && alarm.informada === false);
    }, [filteredAlarms]);

    useEffect(() => {
        const visibleReportableIds = new Set(reportableAlarms.map((alarm) => alarm.id));
        setSelectedAlarmIds((prev) => prev.filter((id) => visibleReportableIds.has(id)));
    }, [reportableAlarms]);

    const selectedFilterLabel =
        STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)?.label ?? "Todas";

    const handleAlarmSelection = (alarmId: string, checked: boolean) => {
        if (checked) {
            setSelectedAlarmIds((prev) => [...prev, alarmId]);
        } else {
            setSelectedAlarmIds((prev) => prev.filter((id) => id !== alarmId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAlarmIds(reportableAlarms.map((alarm) => alarm.id));
        } else {
            setSelectedAlarmIds([]);
        }
    };

    const handleGenerateReport = async () => {
        if (selectedAlarmIds.length === 0) return;

        setIsGeneratingReport(true);
        try {
            const result = await generateAlarmReport(selectedAlarmIds);

            if (result?.informe?.url) {
                window.open(result.informe.url, '_blank');
            }

            setSelectedAlarmIds([]);

            if (onReportGenerated) {
                await onReportGenerated();
            }
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <>
            <Card className="h-full">
                <CardHeader>
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-6 w-6 text-primary" />
                                Alarmas Asignadas
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            </CardTitle>
                            <CardDescription>
                                {isLoading
                                    ? 'Cargando alarmas filtradas...'
                                    : statusFilter === "all"
                                        ? `Mostrando ${filteredAlarms.length} alarmas`
                                        : `Mostrando ${filteredAlarms.length} alarmas (${selectedFilterLabel})`}
                            </CardDescription>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AlarmStatusFilter)}>
                                <SelectTrigger className="w-full sm:w-[240px]">
                                    <SelectValue placeholder="Filtrar por estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_FILTER_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {reportableAlarms.length > 0 && (
                                <Button
                                    onClick={handleGenerateReport}
                                    disabled={selectedAlarmIds.length === 0 || isGeneratingReport}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    {isGeneratingReport
                                        ? 'Generando...'
                                        : `Generar Informe ${selectedAlarmIds.length > 0 ? `(${selectedAlarmIds.length})` : ''}`}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredAlarms.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {reportableAlarms.length > 0 && (
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={selectedAlarmIds.length === reportableAlarms.length && reportableAlarms.length > 0}
                                                    onCheckedChange={handleSelectAll}
                                                    aria-label="Seleccionar todas las alarmas para informe"
                                                />
                                            </TableHead>
                                        )}
                                        <TableHead>Tipo de Anomalia</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-center w-[120px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAlarms.map((alarm) => {
                                        const statusInfo = getAlarmStatusInfo(alarm.status);
                                        const isReportable = alarm.status === 'confirmed' && alarm.informada === false;

                                        return (
                                            <TableRow key={alarm.id}>
                                                {reportableAlarms.length > 0 && (
                                                    <TableCell>
                                                        {isReportable ? (
                                                            <Checkbox
                                                                checked={selectedAlarmIds.includes(alarm.id)}
                                                                onCheckedChange={(checked) => handleAlarmSelection(alarm.id, checked as boolean)}
                                                                aria-label={`Seleccionar alarma ${alarm.type}`}
                                                            />
                                                        ) : null}
                                                    </TableCell>
                                                )}
                                                <TableCell className="font-medium">
                                                    {alarm.anomalia?.nomAnomalia || alarm.type}
                                                </TableCell>
                                                <TableCell>{formatCorrectedTimestamp(alarm.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Badge variant={statusInfo.variant as "default" | "secondary" | "destructive" | "outline" | null | undefined} className="capitalize">
                                                            {statusInfo.label}
                                                        </Badge>
                                                        {alarm.status === 'confirmed' && alarm.informada === true && (
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                                                Informada
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => setSelectedAlarm(alarm)} title="Ver detalles">
                                                            <Eye className="h-4 w-4" />
                                                            <span className="sr-only">Ver detalles</span>
                                                        </Button>
                                                        <a href={`/proxy/alarmas/${alarm.id}/reporte`} download title="Descargar Informe PDF">
                                                            <Button variant="ghost" size="icon">
                                                                <Download className="h-4 w-4" />
                                                                <span className="sr-only">Descargar Informe</span>
                                                            </Button>
                                                        </a>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg h-48">
                            <p className="font-semibold">No se encontraron alarmas con los filtros seleccionados.</p>
                            <p className="text-sm text-muted-foreground mt-2">Intenta ajustar los filtros para ver mas resultados.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedAlarm} onOpenChange={(isOpen) => !isOpen && setSelectedAlarm(null)}>
                <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
                    {selectedAlarm && (
                        <>
                            <DialogHeader className="p-6 pb-2 sr-only">
                                <DialogTitle>Detalles de Alarma de Chofer</DialogTitle>
                                <DialogDescription>
                                    Mostrando detalles para la alarma de tipo {selectedAlarm.type} del chofer.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="p-6 pt-0 overflow-y-auto flex-grow">
                                <AlarmDetails alarm={selectedAlarm} onDriverReassign={undefined} />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
