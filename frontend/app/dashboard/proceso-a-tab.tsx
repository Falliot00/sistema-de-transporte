// frontend/app/dashboard/proceso-a-tab.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ProcesoAData } from "@/types";
import { AlertTriangle, XCircle, Clock } from "lucide-react";

interface ProcesoATabProps {
  data: ProcesoAData;
}

const volumenConfig = {
  Total: { label: "Total", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const alarmasDayConfig = {
  Pendientes: { label: "Pendientes", color: "hsl(var(--chart-4))" },
  Rechazadas: { label: "Rechazadas", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

const hourlyConfig = {
  alarmas: { label: "Alarmas", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function ProcesoATab({ data }: ProcesoATabProps) {
  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sospechadas por A</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.sospechadas.toLocaleString('es-AR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alarmas que pasaron de Pendiente a Sospechosa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas por A</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.rechazadas.toLocaleString('es-AR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alarmas rechazadas directamente desde Pendiente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes sin procesar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.pendientes.toLocaleString('es-AR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alarmas que quedaron en estado Pendiente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Volumen de alarmas totales por día */}
      <Card>
        <CardHeader>
          <CardTitle>Volumen de Alarmas Totales por Día</CardTitle>
          <CardDescription>Cantidad total de alarmas generadas cada día.</CardDescription>
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

      {/* Alarmas por día: Pendientes + Rechazadas A */}
      <Card>
        <CardHeader>
          <CardTitle>Alarmas por Día — Proceso A</CardTitle>
          <CardDescription>Pendientes y Rechazadas por el Proceso A (de Pendiente a Rechazada).</CardDescription>
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
                <Bar dataKey="Pendientes" stackId="a" fill="var(--color-Pendientes)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Rechazadas" stackId="a" fill="var(--color-Rechazadas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Distribución Horaria */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución Horaria de Alarmas</CardTitle>
          <CardDescription>Picos de actividad de alarmas durante el día.</CardDescription>
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
