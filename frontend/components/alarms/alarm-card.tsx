"use client";

import { Alarm } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn, getAlarmStatusInfo, getColorVariantForType, ALARM_STATUS_BORDER_COLORS } from "@/lib/utils";
import { CarFront, Clock, User } from "lucide-react";

interface AlarmCardProps {
  alarm: Alarm;
  onClick: () => void;
}

export function AlarmCard({ alarm, onClick }: AlarmCardProps) {
  // Con utils.ts corregido, esta función ahora devuelve un objeto válido.
  const statusInfo = getAlarmStatusInfo(alarm.status);
  const typeColorVariant = getColorVariantForType(alarm.type);
  const statusBorderClass = ALARM_STATUS_BORDER_COLORS[alarm.status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card text-card-foreground rounded-lg border border-l-4 p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1",
        statusBorderClass
      )}
    >
      <div className="flex justify-between items-center mb-3">
        <Badge variant={typeColorVariant} className="font-semibold">{alarm.type}</Badge>
        <span className="text-xs text-muted-foreground">
            {new Date(alarm.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <div className="space-y-1.5 text-sm mb-4">
        <div className="flex items-center gap-2 font-medium">
          <User className="h-4 w-4 text-primary" /> <span>{alarm.driver.name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CarFront className="h-4 w-4" /> <span>{alarm.vehicle.licensePlate}</span>
        </div>
      </div>
       
      <div className="flex justify-between items-center text-xs border-t pt-2 mt-2">
          <span className="text-muted-foreground flex items-center gap-1">
             <Clock className="h-3 w-3" />
             {new Date(alarm.timestamp).toLocaleDateString('es-AR')}
          </span>
          {/* Al no ser 'undefined', esta línea ya no causará el error */}
          <Badge variant={statusInfo.variant} className="capitalize">{statusInfo.label}</Badge>
      </div>
    </div>
  );
}