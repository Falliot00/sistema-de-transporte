"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ComposedChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ProcesoBData } from "@/types";
import { CheckCircle, XCircle, Clock, Percent, FileSpreadsheet } from "lucide-react";
import { AlarmsByTypePieChart } from "@/app/dashboard/charts/alarms-by-type-pie-chart";
import { calculateLinearTrend } from "@/app/dashboard/charts/trend-utils";
import { exportRowsToCsv } from "@/lib/csv";

interface ProcesoBTabProps {
  data: ProcesoBData;
}

const SOSPECHOSAS_COLOR = "#3b82f6";
const CONFIRMADAS_COLOR = "#22c55e";
const RECHAZADAS_COLOR = "hsl(var(--destructive))";

type ProcesoBTrendKey = "Total" | "Sospechosas" | "Confirmadas" | "Rechazadas";

const PROCESO_B_TREND_LABELS: Record<ProcesoBTrendKey, string> = {
  Total: "Tendencia total sospechosas",
  Sospechosas: "Tendencia sospechosas pendientes",
  Confirmadas: "Tendencia confirmadas",
  Rechazadas: "Tendencia rechazadas",
};

const volumenSospechosasConfig = {
  Sospechosas: { label: "Sospechosas", color: SOSPECHOSAS_COLOR },
  Tendencia: { label: "Tendencia", color: "#111827" },
} satisfies ChartConfig;

const alarmasDayBConfig = {
  Total: { label: "Total", color: "hsl(var(--chart-1))" },
  Sospechosas: { label: "Sospechosas pendientes", color: SOSPECHOSAS_COLOR },
  Confirmadas: { label: "Confirmadas", color: CONFIRMADAS_COLOR },
  Rechazadas: { label: "Rechazadas", color: RECHAZADAS_COLOR },
  TendenciaGeneral: { label: "Tendencia", color: "#111827" },
} satisfies ChartConfig;

const alarmasDayBPercentConfig = {
  Sospechosas: { label: "Sospechosas pendientes", color: SOSPECHOSAS_COLOR },
  Confirmadas: { label: "Confirmadas", color: CONFIRMADAS_COLOR },
  Rechazadas: { label: "Rechazadas", color: RECHAZADAS_COLOR },
} satisfies ChartConfig;

export function ProcesoBTab({ data }: ProcesoBTabProps) {
  const [selectedTrendKey, setSelectedTrendKey] = useState<ProcesoBTrendKey>("Total");

  const trendColorByKey: Record<ProcesoBTrendKey, string> = {
    Total: "#111827",
    Sospechosas: "#1d4ed8",
    Confirmadas: "#15803d",
    Rechazadas: "#b91c1c",
  };

  const volumenSospechosasConTendencia = useMemo(() => {
    const volumenData = data.volumenSospechosasPorDia || [];
    const trend = calculateLinearTrend(volumenData.map((item) => Number(item.Sospechosas) || 0));

    return volumenData.map((item, index) => ({
      ...item,
      Tendencia: trend[index] ?? 0,
    }));
  }, [data.volumenSospechosasPorDia]);

  const alarmasPorDiaConTendencia = useMemo(() => {
    const baseRows = (data.alarmasPorDia || []).map((item) => {
      const sospechosas = Number(item.Sospechosas) || 0;
      const confirmadas = Number(item.Confirmadas) || 0;
      const rechazadas = Number(item.Rechazadas) || 0;

      return {
        ...item,
        Sospechosas: sospechosas,
        Confirmadas: confirmadas,
        Rechazadas: rechazadas,
        Total: sospechosas + confirmadas + rechazadas,
      };
    });

    const trendByKey: Record<ProcesoBTrendKey, number[]> = {
      Total: calculateLinearTrend(baseRows.map((row) => row.Total)),
      Sospechosas: calculateLinearTrend(baseRows.map((row) => row.Sospechosas)),
      Confirmadas: calculateLinearTrend(baseRows.map((row) => row.Confirmadas)),
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
        const confirmadas = Number(item.Confirmadas) || 0;
        const rechazadas = Number(item.Rechazadas) || 0;
        const total = sospechosas + confirmadas + rechazadas;

        if (total === 0) {
          return {
            name: item.name,
            Sospechosas: 0,
            Confirmadas: 0,
            Rechazadas: 0,
          };
        }

        return {
          name: item.name,
          Sospechosas: Number(((sospechosas / total) * 100).toFixed(1)),
          Confirmadas: Number(((confirmadas / total) * 100).toFixed(1)),
          Rechazadas: Number(((rechazadas / total) * 100).toFixed(1)),
        };
      }),
    [data.alarmasPorDia]
  );

  const distribucionAnomaliaData = useMemo(
    () =>
      (data.distribucionPorAnomalia || []).map((item) => ({
        name: item.name,
        value: item.value,
      })),
    [data.distribucionPorAnomalia]
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
        onClick={() => setSelectedTrendKey("Confirmadas")}
        className={`inline-flex items-center gap-1.5 ${selectedTrendKey === "Confirmadas" ? "font-semibold" : "opacity-70 hover:opacity-100"}`}
      >
        <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: "var(--color-Confirmadas)" }} />
        Confirmadas
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
        {PROCESO_B_TREND_LABELS[selectedTrendKey]}
      </button>
    </div>
  );

  const handleExportVolumen = () => {
    exportRowsToCsv("proceso-b-volumen-alarmas-sospechosas-por-dia.csv", volumenSospechosasConTendencia, [
      { header: "Dia", accessor: (row) => row.name },
      { header: "Sospechosas", accessor: (row) => row.Sospechosas },
      { header: "Tendencia", accessor: (row) => row.Tendencia.toFixed(2) },
    ]);
  };

  const handleExportAlarmasPorDia = () => {
    exportRowsToCsv("proceso-b-alarmas-por-dia.csv", alarmasPorDiaConTendencia, [
      { header: "Dia", accessor: (row) => row.name },
      { header: "Sospechosas", accessor: (row) => row.Sospechosas },
      { header: "Confirmadas", accessor: (row) => row.Confirmadas },
      { header: "Rechazadas", accessor: (row) => row.Rechazadas },
      { header: "Total", accessor: (row) => row.Total },
      { header: PROCESO_B_TREND_LABELS[selectedTrendKey], accessor: (row) => row.TendenciaGeneral.toFixed(2) },
    ]);
  };

  const handleExportAlarmasPorDiaPercent = () => {
    exportRowsToCsv("proceso-b-alarmas-por-dia-100-apiladas.csv", alarmasPorDiaPercent, [
      { header: "Dia", accessor: (row) => row.name },
      { header: "Sospechosas (%)", accessor: (row) => row.Sospechosas },
      { header: "Confirmadas (%)", accessor: (row) => row.Confirmadas },
      { header: "Rechazadas (%)", accessor: (row) => row.Rechazadas },
    ]);
  };

  const handleExportDistribucionAnomalia = () => {
    const total = distribucionAnomaliaData.reduce((acc, item) => acc + item.value, 0);

    exportRowsToCsv("proceso-b-distribucion-por-tipo-de-anomalia.csv", distribucionAnomaliaData, [
      { header: "Tipo de anomalia", accessor: (row) => row.name },
      { header: "Cantidad", accessor: (row) => row.value },
      { header: "Porcentaje (%)", accessor: (row) => (total > 0 ? ((row.value / total) * 100).toFixed(1) : "0.0") },
    ]);
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="sr-only">Metricas del proceso B</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas por B</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.confirmadas.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground mt-1">Alarmas confirmadas desde Sospechosa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas por B</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.rechazadas.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground mt-1">Alarmas rechazadas desde Sospechosa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sospechosas sin procesar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.sospechosasSinProcesar.toLocaleString("es-AR")}</div>
            <p className="text-xs text-muted-foreground mt-1">Alarmas que quedaron en estado Sospechosa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Confirmacion</CardTitle>
            <Percent className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.tasaConfirmacion}%</div>
            <p className="text-xs text-muted-foreground mt-1">En base a las Sospechosas totales</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Volumen de Alarmas Sospechosas por Dia</CardTitle>
            <CardDescription>Cantidad de alarmas que llegaron a Sospechosa cada dia.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleExportVolumen}
            disabled={volumenSospechosasConTendencia.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent className="pl-2">
          {data.volumenSospechosasPorDia.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={volumenSospechosasConfig} className="h-[350px] w-full">
              <ComposedChart data={volumenSospechosasConTendencia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Sospechosas" fill="var(--color-Sospechosas)" radius={[4, 4, 0, 0]} />
                <Line
                  type="linear"
                  dataKey="Tendencia"
                  name="Tendencia sospechosas"
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
            <CardTitle>Alarmas por Dia - Proceso B</CardTitle>
            <CardDescription>Sospechosas pendientes por evaluar, Confirmadas y Rechazadas por el Proceso B. Hace clic en una etiqueta para cambiar la tendencia.</CardDescription>
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
            <ChartContainer config={alarmasDayBConfig} className="h-[350px] w-full">
              <ComposedChart data={alarmasPorDiaConTendencia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
                <Legend content={renderInteractiveTrendLegend} />
                <Bar dataKey="Sospechosas" stackId="a" fill="var(--color-Sospechosas)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Confirmadas" stackId="a" fill="var(--color-Confirmadas)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Rechazadas" stackId="a" fill="var(--color-Rechazadas)" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="TendenciaGeneral"
                  name={PROCESO_B_TREND_LABELS[selectedTrendKey]}
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
            <CardTitle>Alarmas por Dia - Proceso B (Barras 100% apiladas)</CardTitle>
            <CardDescription>Distribucion porcentual diaria de Sospechosas pendientes, Confirmadas y Rechazadas.</CardDescription>
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
            <ChartContainer config={alarmasDayBPercentConfig} className="h-[350px] w-full">
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
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                  content={<ChartTooltipContent />}
                />
                <Legend />
                <Bar dataKey="Sospechosas" stackId="a" fill="var(--color-Sospechosas)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Confirmadas" stackId="a" fill="var(--color-Confirmadas)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Rechazadas" stackId="a" fill="var(--color-Rechazadas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Distribucion por Tipo de Anomalia</CardTitle>
            <CardDescription>Alarmas confirmadas de Proceso B agrupadas por anomalia.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleExportDistribucionAnomalia}
            disabled={distribucionAnomaliaData.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <AlarmsByTypePieChart data={distribucionAnomaliaData} />
        </CardContent>
      </Card>
    </div>
  );
}
