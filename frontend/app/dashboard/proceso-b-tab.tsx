"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ProcesoBData } from "@/types";
import { CheckCircle, XCircle, Clock, Percent } from "lucide-react";
import { AlarmsByTypePieChart } from "@/app/dashboard/charts/alarms-by-type-pie-chart";

interface ProcesoBTabProps {
  data: ProcesoBData;
}

const SOSPECHOSAS_COLOR = "#3b82f6";
const CONFIRMADAS_COLOR = "#22c55e";
const RECHAZADAS_COLOR = "hsl(var(--destructive))";

const volumenSospechosasConfig = {
  Sospechosas: { label: "Sospechosas", color: SOSPECHOSAS_COLOR },
} satisfies ChartConfig;

const alarmasDayBConfig = {
  Sospechosas: { label: "Sospechosas", color: SOSPECHOSAS_COLOR },
  Confirmadas: { label: "Confirmadas", color: CONFIRMADAS_COLOR },
  Rechazadas: { label: "Rechazadas", color: RECHAZADAS_COLOR },
} satisfies ChartConfig;

const alarmasDayBPercentConfig = {
  Sospechosas: { label: "Sospechosas", color: SOSPECHOSAS_COLOR },
  Confirmadas: { label: "Confirmadas", color: CONFIRMADAS_COLOR },
  Rechazadas: { label: "Rechazadas", color: RECHAZADAS_COLOR },
} satisfies ChartConfig;

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#f59e0b",
  "#9333ea",
  "#0d9488",
  "#ea580c",
  "#0891b2",
  "#be123c",
  "#64748b",
];

export function ProcesoBTab({ data }: ProcesoBTabProps) {
  const alarmasPorDiaPercent = (data.alarmasPorDia || []).map((item) => {
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
  });

  const distribucionAnomaliaData = (data.distribucionPorAnomalia || []).map((item, index) => ({
    name: item.name,
    value: item.value,
    fill: PIE_COLORS[index % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6 mt-4">
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
        <CardHeader>
          <CardTitle>Volumen de Alarmas Sospechosas por Dia</CardTitle>
          <CardDescription>Cantidad de alarmas que llegaron a Sospechosa cada dia.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {data.volumenSospechosasPorDia.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={volumenSospechosasConfig} className="h-[350px] w-full">
              <BarChart data={data.volumenSospechosasPorDia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Sospechosas" fill="var(--color-Sospechosas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alarmas por Dia - Proceso B</CardTitle>
          <CardDescription>Sospechosas, Confirmadas y Rechazadas por el Proceso B.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {data.alarmasPorDia.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={alarmasDayBConfig} className="h-[350px] w-full">
              <BarChart data={data.alarmasPorDia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
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
        <CardHeader>
          <CardTitle>Alarmas por Dia - Proceso B (Barras 100% apiladas)</CardTitle>
          <CardDescription>Distribucion porcentual diaria de Sospechosas, Confirmadas y Rechazadas.</CardDescription>
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
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                    />
                  }
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
        <CardHeader>
          <CardTitle>Distribucion por Tipo de Anomalia</CardTitle>
          <CardDescription>Alarmas confirmadas de Proceso B agrupadas por anomalia.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlarmsByTypePieChart data={distribucionAnomaliaData} />
        </CardContent>
      </Card>
    </div>
  );
}
