// frontend/components/drivers/generated-reports-table.tsx
"use client";

import { DriverReport } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Calendar } from "lucide-react"; 
import { Skeleton } from '@/components/ui/skeleton';

interface GeneratedReportsTableProps {
    reports: DriverReport[];
    isLoading?: boolean;
}

export function GeneratedReportsTable({ reports, isLoading = false }: GeneratedReportsTableProps) {
    
    const formatDateTime = (fecha: string, hora: string) => {
        try {
            const fechaDate = new Date(fecha);
            const horaDate = new Date(`1970-01-01T${hora}`);
            
            const fechaFormatted = fechaDate.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            const horaFormatted = horaDate.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            return { fecha: fechaFormatted, hora: horaFormatted };
        } catch (error) {
            return { fecha: 'N/A', hora: 'N/A' };
        }
    };

    const handleDownload = (url: string, reportId: number) => {
        if (url) {
            // Abrir en nueva pestaña
            window.open(url, '_blank');
        }
    };

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Informes Generados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    Informes Generados
                </CardTitle>
            </CardHeader>
            <CardContent>
                {reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay informes generados</p>
                        <p className="text-sm">Los informes aparecerán aquí cuando se generen desde las alarmas confirmadas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((report) => {
                            const { fecha, hora } = formatDateTime(report.fecha, report.hora);
                            
                            return (
                                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm">
                                                    Informe #{report.id}
                                                </p>
                                                <Badge variant="secondary" className="text-xs">
                                                    {report.totalAlarmas} alarma{report.totalAlarmas !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {fecha}
                                                </span>
                                                <span>
                                                    {hora}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {report.url ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDownload(report.url!, report.id)}
                                                className="gap-2"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Ver PDF
                                            </Button>
                                        ) : (
                                            <Badge variant="destructive" className="text-xs">
                                                Sin URL
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}