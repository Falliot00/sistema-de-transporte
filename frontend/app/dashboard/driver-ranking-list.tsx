// frontend/app/dashboard/driver-ranking-list.tsx
"use client";

import { DriverRanking } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, CheckCircle, Percent } from "lucide-react";

interface DriverRankingListProps {
  drivers: DriverRanking[];
}

export function DriverRankingList({ drivers }: DriverRankingListProps) {
  if (!drivers || drivers.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay choferes con alarmas en el período seleccionado.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {drivers.map((driver) => (
        <Card key={driver.id}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={driver.avatar || undefined} alt={driver.name} />
                <AvatarFallback>{driver.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-md font-bold">{driver.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {driver.id}</p>
              </div>
            </div>
            
            {/* --- REQUERIMIENTO 6: Actualizamos la información mostrada --- */}
            <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-green-500"/> Eficiencia</span>
                    <span className="font-semibold">{driver.efficiencyScore}%</span>
                  </div>
                  <Progress value={driver.efficiencyScore} indicatorClassName="bg-green-500" className="h-2"/>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><AlertTriangle className="h-4 w-4"/> Alarmas Totales</span>
                  <Badge variant="outline">{driver.totalAlarms}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="h-4 w-4 text-green-500"/> Alarmas Confirmadas</span>
                  <Badge variant="success">{driver.confirmedAlarms}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Percent className="h-4 w-4 text-blue-500"/> Tasa Confirmación</span>
                  <Badge variant={driver.confirmationRate > 50 ? "destructive" : "default"}>
                    {driver.confirmationRate}%
                  </Badge>
                </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}