// frontend/components/drivers/recent-alarms-table.tsx
"use client";

import { useState } from 'react';
import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAlarmStatusInfo, formatCorrectedTimestamp } from "@/lib/utils";
import { History, Eye, Download } from "lucide-react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlarmDetails } from '@/components/alarms/alarm-details';

interface RecentAlarmsTableProps {
    alarms: Alarm[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function RecentAlarmsTable({ alarms }: RecentAlarmsTableProps) {
    const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);

    return (
        <>
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-6 w-6 text-primary" />
                        Alarmas Recientes
                    </CardTitle>
                    <CardDescription>
                        Últimas 10 alarmas registradas para este chofer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {alarms && alarms.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo de Alarma</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        {/* --- SOLUCIÓN 1: Centrar el texto del encabezado --- */}
                                        <TableHead className="text-center w-[120px]">Acciones</TableHead> 
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alarms.map((alarm) => {
                                        const statusInfo = getAlarmStatusInfo(alarm.status);
                                        return (
                                            <TableRow key={alarm.id}>
                                                <TableCell className="font-medium">{alarm.type}</TableCell>
                                                <TableCell>{formatCorrectedTimestamp(alarm.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={statusInfo.variant as any} className="capitalize">{statusInfo.label}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {/* --- SOLUCIÓN 2: Centrar los botones --- */}
                                                    <div className="flex justify-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => setSelectedAlarm(alarm)} title="Ver detalles">
                                                            <Eye className="h-4 w-4" />
                                                            <span className="sr-only">Ver detalles</span>
                                                        </Button>
                                                        <a href={`${API_URL}/alarmas/${alarm.id}/reporte`} download title="Descargar Informe PDF">
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
                            <p className="font-semibold">Este chofer no tiene alarmas recientes.</p>
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
                              <AlarmDetails alarm={selectedAlarm} />
                           </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}