// frontend/app/dashboard/charts/alarms-by-day-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface AlarmsByDayChartProps {
  data: Array<{ name: string; Total: number; Confirmadas: number; Pendientes: number; }>;
}

const chartConfig = {
  Total: { label: "Total", color: "hsl(var(--chart-1))" },
  Confirmadas: { label: "Confirmadas", color: "hsl(var(--chart-2))" },
  Pendientes: { label: "Pendientes", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

export function AlarmsByDayChart({ data }: AlarmsByDayChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>;
  }
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
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
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}