// frontend/app/dashboard/charts/alarms-by-type-pie-chart.tsx
"use client";

import { useMemo } from "react";
import { Tooltip, Treemap } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface AlarmsByTypePieChartProps {
  data: Array<{ name: string; value: number; fill: string }>;
}

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  payload?: {
    fill?: string;
    name?: string;
    value?: number;
  };
}

function truncateLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) {
    return label;
  }

  return `${label.slice(0, Math.max(4, maxChars - 1)).trim()}...`;
}

function TreemapCellContent({ x = 0, y = 0, width = 0, height = 0, name = "", value = 0, payload }: TreemapContentProps) {
  const fill = payload?.fill || "#2563eb";

  if (width <= 0 || height <= 0) {
    return null;
  }

  const canRenderPrimaryText = width >= 60 && height >= 22;
  const canRenderSecondaryText = width >= 90 && height >= 38;
  const maxChars = Math.max(8, Math.floor(width / 7));
  const primaryLabel = truncateLabel(name, maxChars);

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="hsl(var(--background))" strokeWidth={1} rx={4} ry={4} />
      {canRenderPrimaryText && (
        <text x={x + 6} y={y + 16} fill="white" fontSize={12} fontWeight={600}>
          {primaryLabel}
        </text>
      )}
      {canRenderSecondaryText && (
        <text x={x + 6} y={y + 31} fill="rgba(255,255,255,0.95)" fontSize={11}>
          {Number(value).toLocaleString("es-AR")}
        </text>
      )}
    </g>
  );
}

export function AlarmsByTypePieChart({ data }: AlarmsByTypePieChartProps) {
  const safeData = useMemo(() => data ?? [], [data]);
  const total = useMemo(() => safeData.reduce((sum, item) => sum + item.value, 0), [safeData]);
  const sortedData = useMemo(() => [...safeData].sort((a, b) => b.value - a.value), [safeData]);

  const chartConfig = useMemo(
    () =>
      sortedData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
      }, {} as ChartConfig),
    [sortedData]
  );

  if (sortedData.length === 0) {
    return <div className="flex items-center justify-center h-[350px] text-muted-foreground">No hay datos disponibles.</div>;
  }

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="h-[380px] w-full">
        <Treemap data={sortedData} dataKey="value" nameKey="name" isAnimationActive={false} content={<TreemapCellContent />}>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }

              const node = payload[0]?.payload as { name?: string; value?: number; fill?: string } | undefined;

              if (!node) {
                return null;
              }

              const percentage = total > 0 ? ((node.value || 0) / total) * 100 : 0;

              return (
                <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                  <div className="font-medium text-foreground">{node.name || "Sin nombre"}</div>
                  <div className="mt-1 text-muted-foreground">
                    {Number(node.value || 0).toLocaleString("es-AR")} ({percentage.toFixed(1)}%)
                  </div>
                </div>
              );
            }}
          />
        </Treemap>
      </ChartContainer>

      <div className="grid gap-2 md:grid-cols-2">
        {sortedData.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;

          return (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.fill }} />
              <span className="max-w-[230px] flex-1 truncate text-muted-foreground" title={item.name}>
                {item.name}
              </span>
              <span className="font-mono tabular-nums text-foreground">{item.value.toLocaleString("es-AR")}</span>
              <span className="font-mono tabular-nums text-muted-foreground">{percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
