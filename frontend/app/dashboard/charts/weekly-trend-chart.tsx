// frontend/app/dashboard/charts/weekly-trend-chart.tsx
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';

interface WeeklyTrendChartProps {
  data: Array<{ name: string; EsteSemana: number; SemanaPasada: number }>;
}

const chartConfig = {
  EsteSemana: {
    label: "Esta Semana",
    color: "hsl(var(--chart-1))",
  },
  SemanaPasada: {
    label: "Semana Pasada",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>;
  }
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: -20,
          bottom: 5,
        }}
      >
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
           cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1.5, radius: 4 }}
           content={<ChartTooltipContent indicator="line" />}
        />
        <Legend content={<ChartLegendContent />} />
        <Line
          dataKey="EsteSemana"
          type="monotone"
          stroke="var(--color-EsteSemana)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="SemanaPasada"
          type="monotone"
          stroke="var(--color-SemanaPasada)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}