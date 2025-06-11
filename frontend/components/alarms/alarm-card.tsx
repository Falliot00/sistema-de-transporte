"use client";

import { Alarm } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CarFront, Clock, User, AlertCircle } from "lucide-react";

interface AlarmCardProps {
  alarm: Alarm;
  isSelected: boolean;
  onSelect: () => void;
}

// YA NO NECESITAMOS la función getAlarmTypeDescription aquí.

export function AlarmCard({ alarm, isSelected, onSelect }: AlarmCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-all duration-200",
        "bg-card text-card-foreground hover:bg-muted/50",
        isSelected ? "border-primary ring-2 ring-primary/50" : "border-border"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            {/* Mostramos directamente el string que viene de la API */}
            {alarm.type || "Alarma Desconocida"}
        </h3>
        <Badge variant={alarm.status === 'rejected' ? 'destructive' : alarm.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
          {alarm.status}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground space-y-2">
        {/* ... el resto del componente no cambia ... */}
        <div className="flex items-center gap-2">
          <CarFront className="h-4 w-4 flex-shrink-0" />
          <span>{alarm.vehicle.licensePlate}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 flex-shrink-0" />
          <span>{alarm.driver.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{new Date(alarm.timestamp!).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}