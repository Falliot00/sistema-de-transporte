"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, AreaChart, Line, ComposedChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ProcesoAData } from "@/types";
import { AlertTriangle, XCircle, Clock, FileSpreadsheet } from "lucide-react";
import { calculateLinearTrend } from "@/app/dashboard/charts/trend-utils";
import { exportRowsToCsv } from "@/lib/csv";

interface ProcesoATabProps {
  data: ProcesoAData;
}

const SOSPECHOSAS_COLOR = "#3b82f6";
const PENDIENTES_COLOR = "#eab308";
const RECHAZADAS_COLOR = "#ef4444";

type ProcesoATrendKey = "Total" | "Sospechosas" | "Pendientes" | "Rechazadas";

const PROCESO_A_TREND_LABELS: Record<ProcesoATrendKey, string> = {
  Total: "Tendencia total",
  Sospechosas: "Tendencia sospechosas",
  Pendientes: "Tendencia pendientes",
  Rechazadas: "Tendencia rechazadas",
};

const volumenConfig = {
  Total: { label: "Total", color: "hsl(var(--chart-1))" },
  Tendencia: { label: "Tendencia", color: "#111827" },
} satisfies ChartConfig;

const alarmasDayConfig = {
  Total: { label: "Total", color: "hsl(var(--chart-1))" },
  Sospechosas: { label: "Sospechosas", color: SOSPECHOSAS_COLOR },
  Pendientes: { label: "Pendientes", color: PENDIENTES_COLOR },
  Rechazadas: { label: "Rechazadas", color: RECHAZADAS_COLOR },
  TendenciaGeneral: { label: "Tendencia", color: "#111827" },
} satisfies ChartConfig;

const alarmasDayPercentConfig = {
  Sospechosas: { label: "Sospechosas", color: SOSPECHOSAS_COLOR },
  Pendientes: { label: "Pendientes", color: PENDIENTES_COLOR },
  Rechazadas: { label: "Rechazadas", color: RECHAZADAS_COLOR },
} satisfies ChartConfig;

const hourlyConfig = {
  alarmas: { label: "Alarmas", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function ProcesoATab({ data }: ProcesoATabProps) {
  const [selectedTrendKey, setSelectedTrendKey] = useState<ProcesoATrendKey>("Total");

  const trendColorByKey: Record<ProcesoATrendKey, string> = {
    Total: "#111827",
    Sospechosas: "#1d4ed8",
    Pendientes: "#a16207",
    Rechazadas: "#b91c1c",
  };

  const volumenPorDiaConTendencia = useMemo(() => {
    const volumenData = data.volumenPorDia || [];
    const trend = calculateLinearTrend(volumenData.map((item) => Number(item.Total) || 0));

    return volumenData.map((item, index) => ({
      ...item,
      Tendencia: trend[index] ?? 0,
    }));
  }, [data.volumenPorDia]);

  const alarmasPorDiaConTendencia = useMemo(() => {
    const baseRows = (data.alarmasPorDia || []).map((item) => {
      const sospechosas = Number(item.Sospechosas) || 0;
      const pendientes = Number(item.Pendientes) || 0;
      const rechazadas = Number(item.Rechazadas) || 0;

      return {
        ...item,
        Sospechosas: sospechosas,
        Pendientes: pendientes,
        Rechazadas: rechazadas,
        Total: sospechosas + pendientes + rechazadas,
      };
    });

    const trendByKey: Record<ProcesoATrendKey, number[]> = {
      Total: calculateLinearTrend(baseRows.map((row) => row.Total)),
      Sospechosas: calculateLinearTrend(baseRows.map((row) => row.Sospechosas)),
      Pendientes: calculateLinearTrend(baseRows.map((row) => row.Pendientes)),
      Rechazadas: calculateLinearTrend(baseRows.map((row) => row.Rechazadas)),
    };

    return baseRows.map((row, index) => ({
      ...row,
      TendenciaGeneral: trendByKey[selectedTrendKey][index] ?? 0,
    }));
  }, [data.alarmasPorDia, selectedTrendKey]);

  const alarmasPorDiaPercent = useMemo(
    () =>
      (data.alarmasPorDia || []).map((item) => {
        const sospechosas = Number(item.Sospechosas) || 0;
        const pendientes = Number(item.Pendientes) || 0;
        const rechazadas = Number(item.Rechazadas) || 0;
        const total = sospechosas + pendientes + rechazadas;

        if (total === 0) {
          return {
            name: item.name,
            Sospechosas: 0,
            Pendientes: 0,
            Rechazadas: 0,
          };
        }

        return {
          name: item.name,
          Sospechosas: Number(((sospechosas / total) * 100).toFixed(1)),
          Pendientes: Number(((pendientes / total) * 100).toFixed(1)),
          Rechazadas: Number(((rechazadas / total) * 100).toFixed(1)),
        };
      }),
    [data.alarmasPorDia]
  );

  const renderInteractiveTrendLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs">
      <button
        type="button"
        onClick={() => setSelectedTrendKey("Sospechosas")}
        className={`inline-flex items-center gap-1.5 ${selectedTrendKey === "Sospechosas" ? "font-semibold" : "opacity-70 hover:opacity-100"}`}
      >
        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: "var(--color-Sospechosas)" }} />
        Sospechosas
      </button>
      <button
        type="button"
        onClick={() => setSelectedTrendKey("Pendientes")}
        className={`inline-flex items-center gap-1.5 ${selectedTrendKey === "Pendientes" ? "font-semibold" : "opacity-70 hover:opacity-100"}`}
      >
        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: "var(--color-Pendientes)" }} />
        Pendientes
      </button>
      <button
        type="button"
        onClick={() => setSelectedTrendKey("Rechazadas")}
        className={`inline-flex items-center gap-1.5 ${selectedTrendKey === "Rechazadas" ? "font-semibold" : "opacity-70 hover:opacity-100"}`}
      >
        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: "var(--color-Rechazadas)" }} />
        Rechazadas
      </button>
      <button
        type="button"
        onClick={() => setSelectedTrendKey("Total")}
        className={`inline-flex items-center gap-1.5 ${selectedTrendKey === "Total" ? "font-semibold" : "opacity-70 hover:opacity-100"}`}
      >
        <span className="h-[2px] w-3 rounded-full" style={{ backgroundColor: trendColorByKey[selectedTrendKey] }} />
        {PROCESO_A_TREND_LABELS[selectedTrendKey]}
      </button>
    </div>
  );

  const handleExportVolumen = () => {
    exportRowsToCsv("proceso-a-volumen-alarmas-por-dia.csv", volumenPorDiaConTendencia, [
      { header: "Dia", accessor: (row) => row.name },
      { header: "Total", accessor: (row) => row.Total },
      { header: "Tendencia", accessor: (row) => row.Tendencia.toFixed(2) },
    ]);
  };

  const handleExportAlarmasPorDia = () => {
    exportRowsToCsv("proceso-a-alarmas-por-dia.csv", alarmasPorDiaConTendencia, [
      { header: "Dia", accessor: (row) => row.name },
      { header: "Sospechosas", accessor: (row) => row.Sospechosas },
      { header: "Pendientes", accessor: (row) => row.Pendientes },
      { header: "Rechazadas", accessor: (row) => row.Rechazadas },
      { header: "Total", accessor: (row) => row.Total },
      { header: PROCESO_A_TREND_LABELS[selectedTrendKey], accessor: (row) => row.TendenciaGeneral.toFixed(2) },
    ]);
  };

  const handleExportAlarmasPorDiaPercent = () => {
    exportRowsToCsv("proceso-a-alarmas-por-dia-100-apiladas.csv", alarmasPorDiaPercent, [
      { header: "Dia", accessor: (row) => row.name },
      { header: "Sospechosas (%)", accessor: (row) => row.Sospechosas },
      { header: "Pendientes (%)", accessor: (row) => row.Pendientes },
      { header: "Rechazadas (%)", accessor: (row) => row.Rechazadas },
    ]);
  };

  const handleExportDistribucionHoraria = () => {
    exportRowsToCsv("proceso-a-distribucion-horaria.csv", data.distribucionHoraria, [
      { header: "Hora", accessor: (row) => row.hour },
      { header: "Alarmas", accessor: (row) => row.alarmas },
    ]);
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="sr-only">Metricas del proceso A</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sospechadas por A</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.sospechadas.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground mt-1">Alarmas que pasaron de Pendiente a Sospechosa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas por A</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.rechazadas.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground mt-1">Alarmas rechazadas directamente desde Pendiente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes sin procesar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.pendientes.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground mt-1">Alarmas sin transicion en Proceso A (ni Sospechosa ni Rechazada)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Volumen de Alarmas Totales por Dia</CardTitle>
            <CardDescription>Cantidad total de alarmas generadas cada dia.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleExportVolumen}
            disabled={volumenPorDiaConTendencia.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent className="pl-2">
          {data.volumenPorDia.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={volumenConfig} className="h-[350px] w-full">
              <ComposedChart data={volumenPorDiaConTendencia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Total" fill="var(--color-Total)" radius={[4, 4, 0, 0]} />
                <Line
                  type="linear"
                  dataKey="Tendencia"
                  name="Tendencia total"
                  stroke="var(--color-Tendencia)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Alarmas por Dia - Proceso A</CardTitle>
            <CardDescription>Sospechosas, Pendientes y Rechazadas por el Proceso A. Hace clic en una etiqueta para cambiar la tendencia.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleExportAlarmasPorDia}
            disabled={alarmasPorDiaConTendencia.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent className="pl-2">
          {data.alarmasPorDia.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={alarmasDayConfig} className="h-[350px] w-full">
              <ComposedChart data={alarmasPorDiaConTendencia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
                <Legend content={renderInteractiveTrendLegend} />
                <Bar dataKey="Sospechosas" stackId="a" fill="var(--color-Sospechosas)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pendientes" stackId="a" fill="var(--color-Pendientes)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Rechazadas" stackId="a" fill="var(--color-Rechazadas)" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="TendenciaGeneral"
                  name={PROCESO_A_TREND_LABELS[selectedTrendKey]}
                  stroke={trendColorByKey[selectedTrendKey]}
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Alarmas por Dia - Proceso A (Barras 100% apiladas)</CardTitle>
            <CardDescription>Distribucion porcentual diaria de Sospechosas, Pendientes y Rechazadas.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleExportAlarmasPorDiaPercent}
            disabled={alarmasPorDiaPercent.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent className="pl-2">
          {alarmasPorDiaPercent.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={alarmasDayPercentConfig} className="h-[350px] w-full">
              <BarChart data={alarmasPorDiaPercent} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Sospechosas" stackId="a" fill="var(--color-Sospechosas)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pendientes" stackId="a" fill="var(--color-Pendientes)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Rechazadas" stackId="a" fill="var(--color-Rechazadas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Distribucion Horaria de Alarmas</CardTitle>
            <CardDescription>Picos de actividad de alarmas durante el dia.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleExportDistribucionHoraria}
            disabled={data.distribucionHoraria.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent className="pl-2">
          {data.distribucionHoraria.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={hourlyConfig} className="h-[350px] w-full">
              <AreaChart data={data.distribucionHoraria} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="alarmas" type="monotone" fill="var(--color-alarmas)" fillOpacity={0.4} stroke="var(--color-alarmas)" />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
