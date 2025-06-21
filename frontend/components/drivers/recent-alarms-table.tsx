// frontend/components/drivers/recent-alarms-table.tsx
"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAlarmStatusInfo, formatCorrectedTimestamp } from "@/lib/utils";
import Link from 'next/link';
import { History, Eye } from "lucide-react";

interface RecentAlarmsTableProps {
    alarms: Alarm[];
}

export function RecentAlarmsTable({ alarms }: RecentAlarmsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-6 w-6" />
                    Alarmas Recientes
                </CardTitle>
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
                                    <TableHead className="text-right">Acción</TableHead>
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
                                            <TableCell className="text-right">
                                                <Button asChild variant="ghost" size="icon">
                                                    <Link href={`/?alarmId=${alarm.id}`} aria-label="Ver detalles de la alarma">
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                        <p className="font-semibold">Este chofer no tiene alarmas recientes.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}