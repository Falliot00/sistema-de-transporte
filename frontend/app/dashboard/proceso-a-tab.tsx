"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ProcesoAData } from "@/types";
import { AlertTriangle, XCircle, Clock } from "lucide-react";

interface ProcesoATabProps {
  data: ProcesoAData;
}

const SOSPECHOSAS_COLOR = "#3b82f6";
const PENDIENTES_COLOR = "#eab308";
const RECHAZADAS_COLOR = "#ef4444";

const volumenConfig = {
  Total: { label: "Total", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const alarmasDayConfig = {
  Sospechosas: { label: "Sospechosas", color: SOSPECHOSAS_COLOR },
  Pendientes: { label: "Pendientes", color: PENDIENTES_COLOR },
  Rechazadas: { label: "Rechazadas", color: RECHAZADAS_COLOR },
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
  const alarmasPorDiaPercent = (data.alarmasPorDia || []).map((item) => {
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
  });

  return (
    <div className="space-y-6 mt-4">
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
        <CardHeader>
          <CardTitle>Volumen de Alarmas Totales por Dia</CardTitle>
          <CardDescription>Cantidad total de alarmas generadas cada dia.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {data.volumenPorDia.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={volumenConfig} className="h-[350px] w-full">
              <BarChart data={data.volumenPorDia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))", radius: 4 }} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Total" fill="var(--color-Total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alarmas por Dia - Proceso A</CardTitle>
          <CardDescription>Sospechosas, Pendientes y Rechazadas por el Proceso A.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {data.alarmasPorDia.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>
          ) : (
            <ChartContainer config={alarmasDayConfig} className="h-[350px] w-full">
              <BarChart data={data.alarmasPorDia} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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
        <CardHeader>
          <CardTitle>Alarmas por Dia - Proceso A (Barras 100% apiladas)</CardTitle>
          <CardDescription>Distribucion porcentual diaria de Sospechosas, Pendientes y Rechazadas.</CardDescription>
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
        <CardHeader>
          <CardTitle>Distribucion Horaria de Alarmas</CardTitle>
          <CardDescription>Picos de actividad de alarmas durante el dia.</CardDescription>
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
