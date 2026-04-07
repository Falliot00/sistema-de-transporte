// frontend/app/drivers/[id]/driver-performance-tab.tsx
"use client";

import { useMemo } from "react";
import { Alarm, DriverReport } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/shared/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { CartesianGrid, Legend, Line, LineChart, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import {
    AlertTriangle,
    Bell,
    CheckCircle,
    Clock,
    FileText,
    Megaphone,
    Percent,
    TrendingDown,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { calculateLinearTrend } from "@/app/dashboard/charts/trend-utils";

interface DriverPerformanceTabProps {
    alarms: Alarm[];
    reports: DriverReport[];
    isLoading?: boolean;
}

const chartConfig = {
    alarmas: {
        label: "Alarmas",
        color: "hsl(var(--chart-1))",
    },
    tendencia: {
        label: "Tendencia",
        color: "hsl(var(--chart-2))",
    },
    marcadorInforme: {
        label: "Informe generado",
        color: "hsl(var(--chart-4))",
    },
} satisfies ChartConfig;

function parseLocalDate(value?: string): Date | null {
    if (!value) return null;
    const normalized = value.endsWith("Z") ? value.slice(0, -1) : value;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
}

function toDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDayKey(dayKey: string): Date {
    const [year, month, day] = dayKey.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function buildReportDate(report: DriverReport): Date | null {
    if (report.hora && report.hora.includes("T")) {
        return parseLocalDate(report.hora);
    }

    if (report.fecha && report.hora && /^\d{2}:\d{2}:\d{2}/.test(report.hora)) {
        const combined = `${report.fecha.split("T")[0]}T${report.hora}`;
        const combinedDate = parseLocalDate(combined);
        if (combinedDate) {
            return combinedDate;
        }
    }

    return parseLocalDate(report.fecha);
}

type TrendDatum = {
    dayKey: string;
    label: string;
    fullDate: string;
    alarmas: number;
    tendencia: number;
    reportes: number;
    marcadorInforme: number | null;
};

type TrendBadge = {
    label: string;
    icon: typeof TrendingUp;
    variant: "default" | "secondary" | "destructive";
};

function TrendTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload[0]?.payload as TrendDatum | undefined;
    if (!point) return null;

    return (
        <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
            <p className="font-semibold mb-1">{point.fullDate}</p>
            <p>Alarmas: <span className="font-medium">{point.alarmas}</span></p>
            <p>Tendencia: <span className="font-medium">{point.tendencia.toFixed(1)}</span></p>
            <p>Informes generados: <span className="font-medium">{point.reportes}</span></p>
        </div>
    );
}

export function DriverPerformanceTab({ alarms, reports, isLoading = false }: DriverPerformanceTabProps) {
    const metrics = useMemo(() => {
        const totalAlarms = alarms.length;
        const confirmedAlarms = alarms.filter((alarm) => alarm.status === "confirmed").length;
        const rejectedAlarms = alarms.filter((alarm) => alarm.status === "rejected").length;
        const suspiciousAlarms = alarms.filter((alarm) => alarm.status === "suspicious").length;
        const informedAlarms = alarms.filter((alarm) => alarm.informada === true).length;
        const pendingReportAlarms = alarms.filter(
            (alarm) => alarm.status === "confirmed" && alarm.informada === false
        ).length;
        const reportsCount = reports.length;
        const confirmationRate = totalAlarms > 0 ? (confirmedAlarms / totalAlarms) * 100 : 0;

        return {
            totalAlarms,
            confirmedAlarms,
            rejectedAlarms,
            suspiciousAlarms,
            informedAlarms,
            pendingReportAlarms,
            reportsCount,
            confirmationRate,
        };
    }, [alarms, reports]);

    const trendData = useMemo<TrendDatum[]>(() => {
        const alarmCountByDay = new Map<string, number>();
        const reportCountByDay = new Map<string, number>();

        alarms.forEach((alarm) => {
            const date = parseLocalDate(alarm.timestamp);
            if (!date) return;
            const key = toDayKey(date);
            alarmCountByDay.set(key, (alarmCountByDay.get(key) ?? 0) + 1);
        });

        reports.forEach((report) => {
            const date = buildReportDate(report);
            if (!date) return;
            const key = toDayKey(date);
            reportCountByDay.set(key, (reportCountByDay.get(key) ?? 0) + 1);
        });

        const allKeys = new Set<string>();
        alarmCountByDay.forEach((_, key) => {
            allKeys.add(key);
        });
        reportCountByDay.forEach((_, key) => {
            allKeys.add(key);
        });

        if (allKeys.size === 0) {
            return [];
        }

        const sortedKeys = Array.from(allKeys).sort();
        const startDate = parseDayKey(sortedKeys[0]);
        const endDate = parseDayKey(sortedKeys[sortedKeys.length - 1]);

        const baseData: Omit<TrendDatum, "tendencia">[] = [];

        for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
            const day = new Date(cursor);
            const dayKey = toDayKey(day);
            const alarmas = alarmCountByDay.get(dayKey) ?? 0;
            const reportes = reportCountByDay.get(dayKey) ?? 0;

            baseData.push({
                dayKey,
                label: day.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
                fullDate: day.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
                alarmas,
                reportes,
                marcadorInforme: reportes > 0 ? alarmas : null,
            });
        }

        const trendValues = calculateLinearTrend(baseData.map((item) => item.alarmas));

        return baseData.map((item, index) => ({
            ...item,
            tendencia: trendValues[index] ?? item.alarmas,
        }));
    }, [alarms, reports]);

    const trendBadge = useMemo<TrendBadge>(() => {
        if (trendData.length < 2) {
            return {
                label: "Tendencia sin datos suficientes",
                icon: TrendingUp,
                variant: "secondary",
            };
        }

        const first = trendData[0].tendencia;
        const last = trendData[trendData.length - 1].tendencia;
        const delta = last - first;

        if (delta > 0.25) {
            return {
                label: "Tendencia negativa (suben alarmas)",
                icon: TrendingUp,
                variant: "destructive",
            };
        }

        if (delta < -0.25) {
            return {
                label: "Tendencia positiva (bajan alarmas)",
                icon: TrendingDown,
                variant: "default",
            };
        }

        return {
            label: "Tendencia estable",
            icon: TrendingUp,
            variant: "secondary",
        };
    }, [trendData]);

    if (isLoading) {
        return (
            <div className="space-y-6 mt-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Skeleton key={index} className="h-28 w-full" />
                    ))}
                </div>
                <Skeleton className="h-[420px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KPICard
                    title="Alarmas totales"
                    value={metrics.totalAlarms}
                    icon={<Bell className="h-5 w-5" />}
                    iconClassName="text-slate-600"
                />
                <KPICard
                    title="Alarmas confirmadas"
                    value={metrics.confirmedAlarms}
                    icon={<CheckCircle className="h-5 w-5" />}
                    iconClassName="text-green-600"
                />
                <KPICard
                    title="Alarmas rechazadas"
                    value={metrics.rejectedAlarms}
                    icon={<XCircle className="h-5 w-5" />}
                    iconClassName="text-red-600"
                />
                <KPICard
                    title="Alarmas sospechosas"
                    value={metrics.suspiciousAlarms}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    iconClassName="text-amber-600"
                />
                <KPICard
                    title="Alarmas informadas"
                    value={metrics.informedAlarms}
                    icon={<Megaphone className="h-5 w-5" />}
                    iconClassName="text-blue-600"
                />
                <KPICard
                    title="Pendientes de informe"
                    value={metrics.pendingReportAlarms}
                    icon={<Clock className="h-5 w-5" />}
                    iconClassName="text-orange-600"
                />
                <KPICard
                    title="Cantidad de informes"
                    value={metrics.reportsCount}
                    icon={<FileText className="h-5 w-5" />}
                    iconClassName="text-primary"
                />
                <KPICard
                    title="Tasa de confirmacion"
                    value={`${metrics.confirmationRate.toFixed(1)}%`}
                    description="Confirmadas sobre total de alarmas"
                    icon={<Percent className="h-5 w-5" />}
                    iconClassName="text-violet-600"
                />
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Tendencia de alarmas por chofer</CardTitle>
                        <CardDescription>
                            Se marcan con punto azul las fechas en las que se generaron informes para observar cambios de conducta.
                        </CardDescription>
                    </div>
                    <Badge variant={trendBadge.variant} className="w-fit flex items-center gap-1.5">
                        <trendBadge.icon className="h-3.5 w-3.5" />
                        {trendBadge.label}
                    </Badge>
                </CardHeader>
                <CardContent>
                    {trendData.length === 0 ? (
                        <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                            No hay datos suficientes para generar la tendencia.
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[360px] w-full">
                            <LineChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={24}
                                />
                                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                <Tooltip content={<TrendTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="alarmas"
                                    name="Alarmas"
                                    stroke="var(--color-alarmas)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="tendencia"
                                    name="Tendencia"
                                    stroke="var(--color-tendencia)"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                    dot={false}
                                />
                                <Scatter
                                    dataKey="marcadorInforme"
                                    name="Informe generado"
                                    fill="var(--color-marcadorInforme)"
                                />
                            </LineChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
