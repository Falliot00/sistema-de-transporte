// components/dashboard/charts/alarms-by-type-pie-chart.tsx
"use client";

import { Pie, PieChart, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';

interface AlarmsByTypePieChartProps {
  data: Array<{ name: string; value: number; fill: string; }>;
}

export function AlarmsByTypePieChart({ data }: AlarmsByTypePieChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>;
  }

  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[350px]"
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Tooltip 
            cursor={{fill: "hsl(var(--muted))"}}
            content={<ChartTooltipContent hideLabel />} 
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            labelLine={false}
            // label={({ percent, name }) => `${name}: ${(percent * 100).toFixed(0)}%`} // Can be verbose
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`} // Simpler label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Legend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}