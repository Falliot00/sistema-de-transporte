// frontend/app/dashboard/charts/hourly-distribution-chart.tsx
"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface HourlyDistributionChartProps {
  data: Array<{ hour: string; alarmas: number }>;
}

const chartConfig = {
  alarmas: {
    label: "Alarmas",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function HourlyDistributionChart({ data }: HourlyDistributionChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>;
  }
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="hour"
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
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          dataKey="alarmas"
          type="monotone"
          fill="var(--color-alarmas)"
          fillOpacity={0.4}
          stroke="var(--color-alarmas)"
        />
      </AreaChart>
    </ChartContainer>
  );
}