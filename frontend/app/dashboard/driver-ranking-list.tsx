// frontend/app/dashboard/driver-ranking-list.tsx
"use client";

import { DriverRanking } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, FileText, Percent } from "lucide-react";
import Link from "next/link";

interface DriverRankingListProps {
  drivers: DriverRanking[];
}

const getConfirmationRateBadgeClass = (rate: number): string => {
  const normalizedRate = Math.max(0, Math.min(100, Number.isFinite(rate) ? rate : 0));

  if (normalizedRate <= 25) {
    return "border-transparent bg-green-600 text-white";
  }

  if (normalizedRate <= 50) {
    return "border-transparent bg-yellow-400 text-black";
  }

  if (normalizedRate <= 75) {
    return "border-transparent bg-orange-500 text-white";
  }

  return "border-transparent bg-red-600 text-white";
};

export function DriverRankingList({ drivers }: DriverRankingListProps) {
  if (!drivers || drivers.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay choferes con alarmas en el periodo seleccionado.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {drivers.map((driver) => (
        <Card key={driver.id}>
          <CardContent className="pt-6">
            <Link href={`/drivers/${driver.id}`} className="flex items-center gap-4 mb-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
              <Avatar className="h-12 w-12 ring-2 ring-transparent transition-all group-hover:ring-primary">
                <AvatarImage src={driver.avatar || undefined} alt={driver.name} />
                <AvatarFallback>{driver.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-md font-bold group-hover:text-primary transition-colors">{driver.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {driver.id}</p>
              </div>
            </Link>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Percent className="h-4 w-4 text-blue-500" /> Tasa Confirmacion</span>
                <Badge variant="outline" className={getConfirmationRateBadgeClass(driver.confirmationRate)}>
                  {driver.confirmationRate}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><AlertTriangle className="h-4 w-4" /> Alarmas Totales</span>
                <Badge variant="outline">{driver.totalAlarms}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="h-4 w-4 text-green-500" /> Alarmas Confirmadas</span>
                <Badge variant="success">{driver.confirmedAlarms}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4 text-yellow-600" /> Confirmadas Pendientes de Informe</span>
                <Badge variant="warning">{driver.confirmedNotInformedAlarms}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle className="h-4 w-4 text-blue-500" /> Confirmadas Informadas</span>
                <Badge variant="info">{driver.confirmedInformedAlarms}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><FileText className="h-4 w-4 text-primary" /> Informes Generados</span>
                <Badge variant="secondary">{driver.generatedReports}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
