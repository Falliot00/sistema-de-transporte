// components/dashboard/charts/alarms-by-day-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface AlarmsByDayChartProps {
  data: Array<{ name: string; Total: number; Confirmadas: number; Pendientes: number; }>;
}

const chartConfig = {
  Total: { label: "Total", color: "hsl(var(--chart-1))" }, // Ensure chart-1 is defined in globals.css
  Confirmadas: { label: "Confirmadas", color: "hsl(var(--chart-2))" }, // Ensure chart-2 is defined
  Pendientes: { label: "Pendientes", color: "hsl(var(--chart-4))" }, // Ensure chart-4 is defined
} satisfies ChartConfig;

export function AlarmsByDayChart({ data }: AlarmsByDayChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>;
  }
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}`} 
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
            content={<ChartTooltipContent />} 
          />
          <Legend />
          <Bar dataKey="Confirmadas" stackId="a" fill="var(--color-Confirmadas)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Pendientes" stackId="a" fill="var(--color-Pendientes)" radius={[4, 4, 0, 0]} />
          {/* Consider if 'Total' bar is needed or if stacked bars are sufficient */}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}