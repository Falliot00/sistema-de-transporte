// frontend/app/dashboard/proceso-b-tab.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ProcesoBData } from "@/types";
import { CheckCircle, XCircle, Clock, Percent } from "lucide-react";

interface ProcesoBTabProps {
  data: ProcesoBData;
}

const volumenSospechosasConfig = {
  Sospechosas: { label: "Sospechosas", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const alarmasDayBConfig = {
  Sospechosas: { label: "Sospechosas", color: "hsl(var(--chart-1))" },
  Rechazadas: { label: "Rechazadas", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

export function ProcesoBTab({ data }: ProcesoBTabProps) {
  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas por B</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.confirmadas.toLocaleString('es-AR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alarmas confirmadas desde Sospechosa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas por B</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.rechazadas.toLocaleString('es-AR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alarmas rechazadas desde Sospechosa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sospechosas sin procesar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.sospechosasSinProcesar.toLocaleString('es-AR')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alarmas que quedaron en estado Sospechosa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Confirmación</CardTitle>
            <Percent className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.tasaConfirmacion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              En base a las Sospechosas totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Volumen de alarmas Sospechosas por día */}
      <Card>
        <CardHeader>
          <CardTitle>Volumen de Alarmas Sospechosas por Día</CardTitle>
          <CardDescription>Cantidad de alarmas que llegaron a Sospechosa cada día.</CardDescription>
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

      {/* Alarmas por día: Sospechosas + Rechazadas B */}
      <Card>
        <CardHeader>
          <CardTitle>Alarmas por Día — Proceso B</CardTitle>
          <CardDescription>Sospechosas y Rechazadas por el Proceso B (de Sospechosa a Rechazada).</CardDescription>
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
                <Bar dataKey="Rechazadas" stackId="a" fill="var(--color-Rechazadas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
