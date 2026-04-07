// frontend/app/drivers/[id]/driver-performance-tab.tsx
"use client";

import { useMemo } from "react";
import { Alarm, DriverReport } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/shared/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
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
        label: "Confirmadas por dia",
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

function parseDateOnly(value?: string): Date | null {
    if (!value) return null;

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function parseLocalDateTime(value?: string): Date | null {
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

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function parseAlarmDayDate(timestamp?: string): Date | null {
    return parseDateOnly(timestamp) ?? parseLocalDateTime(timestamp);
}

function buildReportDate(report: DriverReport): Date | null {
    // Priorizamos fecha para evitar parseos ambiguos de "hora" que pueden llevar a epoch.
    const fromFecha = parseDateOnly(report.fecha) ?? parseLocalDateTime(report.fecha);
    if (fromFecha) {
        return fromFecha;
    }

    if (report.hora && report.hora.includes("T")) {
        return parseDateOnly(report.hora) ?? parseLocalDateTime(report.hora);
    }

    return null;
}

function formatDayLabel(dayKey: string, short = false): string {
    const date = parseDayKey(dayKey);
    return date.toLocaleDateString("es-AR", short
        ? { day: "2-digit", month: "2-digit", year: "2-digit" }
        : { day: "2-digit", month: "2-digit", year: "numeric" });
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

type BackgroundSegment = {
    key: string;
    x1: string;
    x2: string;
    isGray: boolean;
};

function TrendTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
    if (!active || !payload || payload.length === 0) return null;

    const point = payload.find((item) => item?.payload)?.payload as TrendDatum | undefined;
    if (!point) return null;

    return (
        <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
            <p className="font-semibold mb-1">{point.fullDate}</p>
            <p>Alarmas confirmadas: <span className="font-medium">{point.alarmas}</span></p>
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
        const allAlarmCountByDay = new Map<string, number>();
        const confirmedAlarmCountByDay = new Map<string, number>();
        const reportCountByDay = new Map<string, number>();

        alarms.forEach((alarm) => {
            const date = parseAlarmDayDate(alarm.timestamp);
            if (!date) return;
            const key = toDayKey(date);
            allAlarmCountByDay.set(key, (allAlarmCountByDay.get(key) ?? 0) + 1);
            if (alarm.status === "confirmed") {
                confirmedAlarmCountByDay.set(key, (confirmedAlarmCountByDay.get(key) ?? 0) + 1);
            }
        });

        reports.forEach((report) => {
            const date = buildReportDate(report);
            if (!date) return;
            const key = toDayKey(date);
            reportCountByDay.set(key, (reportCountByDay.get(key) ?? 0) + 1);
        });

        const alarmKeys = Array.from(allAlarmCountByDay.keys()).sort();

        if (alarmKeys.length === 0) {
            return [];
        }

        // La serie inicia exactamente en la primera alarma filtrada del chofer.
        const startDate = parseDayKey(alarmKeys[0]);
        const endDate = parseDayKey(alarmKeys[alarmKeys.length - 1]);

        const baseData: Omit<TrendDatum, "tendencia">[] = [];

        for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
            const day = new Date(cursor);
            const dayKey = toDayKey(day);
            const alarmas = confirmedAlarmCountByDay.get(dayKey) ?? 0;
            const reportes = reportCountByDay.get(dayKey) ?? 0;
            const markerBase = alarmas > 0 ? alarmas : 0;

            baseData.push({
                dayKey,
                label: formatDayLabel(dayKey, true),
                fullDate: formatDayLabel(dayKey),
                alarmas,
                reportes,
                marcadorInforme: reportes > 0 ? markerBase + 0.15 : null,
            });
        }

        const trendValues = calculateLinearTrend(baseData.map((item) => item.alarmas));

        return baseData.map((item, index) => ({
            ...item,
            tendencia: trendValues[index] ?? item.alarmas,
        }));
    }, [alarms, reports]);

    const chartBackgroundSegments = useMemo<BackgroundSegment[]>(() => {
        if (trendData.length === 0) {
            return [];
        }

        const startKey = trendData[0].dayKey;
        const endKey = trendData[trendData.length - 1].dayKey;
        const reportBoundaryKeys = trendData
            .filter((point) => point.reportes > 0)
            .map((point) => point.dayKey);

        const boundaries = Array.from(new Set([startKey, ...reportBoundaryKeys])).sort();
        if (boundaries.length === 0) {
            return [];
        }

        const segments: BackgroundSegment[] = [];

        boundaries.forEach((segmentStart, index) => {
            const nextStart = boundaries[index + 1];
            const segmentEnd = nextStart
                ? toDayKey(addDays(parseDayKey(nextStart), -1))
                : endKey;

            if (parseDayKey(segmentStart).getTime() > parseDayKey(segmentEnd).getTime()) {
                return;
            }

            segments.push({
                key: `bg-${segmentStart}-${segmentEnd}`,
                x1: segmentStart,
                x2: segmentEnd,
                isGray: index % 2 === 1,
            });
        });

        return segments.filter((segment) => segment.isGray);
    }, [trendData]);

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
                    title="Alarmas pendientes de informe"
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
                            Barras por alarmas confirmadas diarias, linea de tendencia y marcas para fechas de informes generados.
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
                            <ComposedChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="dayKey"
                                    tickFormatter={(value) => formatDayLabel(value as string, true)}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={24}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, (maxValue: number) => Math.max(1, Math.ceil(maxValue + 1))]}
                                />
                                <Tooltip content={<TrendTooltip />} />
                                <Legend />
                                {chartBackgroundSegments.map((segment) => (
                                    <ReferenceArea
                                        key={segment.key}
                                        x1={segment.x1}
                                        x2={segment.x2}
                                        fill="hsl(var(--muted))"
                                        fillOpacity={0.18}
                                        strokeOpacity={0}
                                    />
                                ))}
                                {trendData
                                    .filter((point) => point.reportes > 0)
                                    .map((point) => (
                                        <ReferenceLine
                                            key={`report-line-${point.dayKey}`}
                                            x={point.dayKey}
                                            stroke="var(--color-marcadorInforme)"
                                            strokeOpacity={0.35}
                                            strokeDasharray="4 4"
                                        />
                                    ))}
                                <Bar
                                    dataKey="alarmas"
                                    name="Alarmas confirmadas por dia"
                                    fill="var(--color-alarmas)"
                                    radius={[4, 4, 0, 0]}
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
                                <Line
                                    type="linear"
                                    dataKey="marcadorInforme"
                                    name="Fecha con informe"
                                    stroke="var(--color-marcadorInforme)"
                                    strokeOpacity={0}
                                    connectNulls={false}
                                    dot={{ r: 4, fill: "var(--color-marcadorInforme)" }}
                                    activeDot={{ r: 6, fill: "var(--color-marcadorInforme)" }}
                                />
                            </ComposedChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
