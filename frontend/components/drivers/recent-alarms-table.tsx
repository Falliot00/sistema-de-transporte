// frontend/components/drivers/recent-alarms-table.tsx
"use client";

import { useState } from 'react';
import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAlarmStatusInfo, formatCorrectedTimestamp } from "@/lib/utils";
import { History, Eye, Download, Loader2, FileText } from "lucide-react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlarmDetails } from '@/components/alarms/alarm-details';
import { Skeleton } from '@/components/ui/skeleton';
import { generateAlarmReport } from "@/lib/api";

interface RecentAlarmsTableProps {
    alarms: Alarm[];
    isLoading?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function RecentAlarmsTable({ alarms, isLoading = false }: RecentAlarmsTableProps) {
    const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
    const [selectedAlarmIds, setSelectedAlarmIds] = useState<string[]>([]);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Filtrar alarmas confirmadas que no han sido informadas para los checkboxes
    const reportableAlarms = alarms.filter(alarm => 
        alarm.status === 'confirmed' && alarm.informada === false
    );

    // Manejar selección/deselección de alarmas
    const handleAlarmSelection = (alarmId: string, checked: boolean) => {
        if (checked) {
            setSelectedAlarmIds(prev => [...prev, alarmId]);
        } else {
            setSelectedAlarmIds(prev => prev.filter(id => id !== alarmId));
        }
    };

    // Manejar selección de todas las alarmas reportables
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAlarmIds(reportableAlarms.map(alarm => alarm.id));
        } else {
            setSelectedAlarmIds([]);
        }
    };

    // Generar informe
    const handleGenerateReport = async () => {
        if (selectedAlarmIds.length === 0) return;
        
        setIsGeneratingReport(true);
        try {
            const result = await generateAlarmReport(selectedAlarmIds);
            console.log('Informe generado:', result);
            // Aquí podrías mostrar un toast de éxito
            setSelectedAlarmIds([]);
        } catch (error) {
            console.error('Error generating report:', error);
            // Aquí podrías mostrar un toast de error
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <>
            <Card className="h-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-6 w-6 text-primary" />
                                Alarmas Recientes
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            </CardTitle>
                            <CardDescription>
                                {isLoading ? 'Cargando alarmas filtradas...' : `Mostrando ${alarms.length} alarmas${alarms.length === 10 ? ' (máximo 10)' : ''}`}
                            </CardDescription>
                        </div>
                        
                        {/* Botón de generar informe */}
                        {reportableAlarms.length > 0 && (
                            <Button 
                                onClick={handleGenerateReport}
                                disabled={selectedAlarmIds.length === 0 || isGeneratingReport}
                                className="flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                {isGeneratingReport ? 'Generando...' : `Generar Informe ${selectedAlarmIds.length > 0 ? `(${selectedAlarmIds.length})` : ''}`}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : alarms && alarms.length > 0 ? (
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
                                        <TableHead>Tipo de Alarma</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-center w-[120px]">Acciones</TableHead> 
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alarms.map((alarm) => {
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
                                                <TableCell className="font-medium">{alarm.type}</TableCell>
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
                                                        {/* Descargar PDF vía proxy para agregar Authorization */}
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
                            <p className="text-sm text-muted-foreground mt-2">Intenta ajustar los filtros para ver más resultados.</p>
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
