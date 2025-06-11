// frontend/components/alarms/alarm-card.tsx

"use client";

import { Alarm } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CarFront, Clock, User } from "lucide-react";

interface AlarmCardProps {
  alarm: Alarm;
  isSelected: boolean;
  onSelect: () => void;
}

// Función para obtener la descripción del tipo de alarma
function getAlarmTypeDescription(type: number | undefined): string {
  switch (type) {
    case 1: return "Exceso de Velocidad";
    case 2: return "Frenada Brusca";
    // Añade más casos según sea necesario
    default: return "Alarma Desconocida";
  }
}

export function AlarmCard({ alarm, isSelected, onSelect }: AlarmCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-all duration-200",
        "bg-card text-card-foreground hover:bg-muted/50",
        isSelected ? "border-primary shadow-md" : "border-border"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-md">{getAlarmTypeDescription(alarm.type)}</h3>
        <Badge variant={alarm.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
          {alarm.status}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground space-y-2">
        <div className="flex items-center gap-2">
          <CarFront className="h-4 w-4" />
          <span>{alarm.vehicle.licensePlate}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{alarm.driver.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{new Date(alarm.timestamp!).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}