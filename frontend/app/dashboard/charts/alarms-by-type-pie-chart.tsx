// frontend/app/dashboard/charts/alarms-by-type-pie-chart.tsx
"use client";

import { Pie, PieChart, Tooltip, Legend, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface AlarmsByTypePieChartProps {
  data: Array<{ name: string; value: number; fill: string; }>;
}

export function AlarmsByTypePieChart({ data }: AlarmsByTypePieChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const valueByName = new Map(data.map((item) => [item.name, item.value]));

  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[350px] w-full"
    >
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
          label={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Legend
          align="right"
          layout="vertical"
          verticalAlign="middle"
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null;

            return (
              <div className="flex flex-col gap-2 pr-2">
                {payload.map((entry, index) => {
                  const name = String(entry.value ?? '');
                  const value = valueByName.get(name) ?? 0;
                  const percentage = total > 0 ? (value / total) * 100 : 0;

                  return (
                    <div key={`${name}-${index}`} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: entry.color || '#999' }}
                      />
                      <span className="max-w-[220px] min-w-[140px] truncate text-muted-foreground" title={name}>
                        {name}
                      </span>
                      <span className="font-mono tabular-nums text-foreground">{value.toLocaleString('es-AR')}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
      </PieChart>
    </ChartContainer>
  );
}
