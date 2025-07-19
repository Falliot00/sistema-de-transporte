// frontend/app/devices/[id]/alarms-by-weekday-chart.tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

interface AlarmsByWeekdayData {
  dayName: string;
  dayOfWeek: number;
  total: number;
}

interface AlarmsByWeekdayChartProps {
  data: AlarmsByWeekdayData[];
}

const chartConfig = {
  total: { label: "Total Alarmas", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const dayOrder = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AlarmsByWeekdayChart({ data }: AlarmsByWeekdayChartProps) {
  const chartData = dayOrder.map(day => {
    const dayData = data.find(d => d.dayName.toLowerCase() === day.toLowerCase());
    return {
      name: day.substring(0, 3), // "Lun", "Mar", etc.
      total: dayData ? dayData.total : 0,
    };
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Alarmas por Día de la Semana
        </CardTitle>
        <CardDescription>
            Distribución histórica de todas las alarmas generadas por este dispositivo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                content={<ChartTooltipContent />} 
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}