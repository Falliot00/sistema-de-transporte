import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPI } from "@/types";
import { getIconByName } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface KPICardProps {
  kpi: KPI;
  className?: string;
}

export function KPICard({ kpi, className }: KPICardProps) {
  const IconComponent = getIconByName(kpi.icon);

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        {kpi.delta !== undefined && (
          <p className={cn(
            "mt-1 text-xs",
            kpi.deltaType === 'increase' 
              ? "text-green-600" 
              : "text-red-600"
          )}>
            {kpi.deltaType === 'increase' ? '↑' : '↓'} {kpi.delta} desde ayer
          </p>
        )}
      </CardContent>
    </Card>
  );
}