// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/components/dashboard/driver-ranking-list.tsx
"use client";

import { Driver } from "@/types"; // Ensure Driver type has totalAlarms, confirmationRate, efficiencyScore
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DriverRankingListProps {
  drivers: Driver[];
}

export function DriverRankingList({ drivers }: DriverRankingListProps) {
  if (!drivers || drivers.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No hay choferes para mostrar.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {drivers.map((driver, index) => (
        <Card key={driver.id || driver.license}>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={(driver as any).avatar || `/avatars/${(index % 5) + 1}.png`} alt={driver.name} />
              <AvatarFallback>{driver.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{driver.name}</CardTitle>
              <CardDescription>Licencia: {driver.license}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Eficiencia</span>
                <span className="font-semibold">{(driver as any).efficiencyScore || 0}%</span>
              </div>
              <Progress value={(driver as any).efficiencyScore || 0} className="h-2" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Alarmas Totales:</span>
              <Badge variant="outline">{(driver as any).totalAlarms || 0}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasa Confirmación:</span>
              <Badge variant={( ((driver as any).confirmationRate || 0) > 75 ? "success" : ((driver as any).confirmationRate || 0) > 50 ? "warning" : "destructive" ) as any}>
                {(driver as any).confirmationRate || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}