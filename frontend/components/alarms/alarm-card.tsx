// frontend/components/alarms/alarm-card.tsx
"use client";

import { Alarm } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn, getAlarmStatusInfo, getColorVariantForType, ALARM_STATUS_BORDER_COLORS, formatCorrectedTimestamp } from "@/lib/utils";
import { CarFront, Clock, User, ShieldAlert } from "lucide-react";

interface AlarmCardProps {
  alarm: Alarm;
  onClick: () => void;
}

export function AlarmCard({ alarm, onClick }: AlarmCardProps) {
  const statusInfo = getAlarmStatusInfo(alarm.status);
  const typeColorVariant = getColorVariantForType(alarm.type);
  const statusBorderClass = ALARM_STATUS_BORDER_COLORS[alarm.status];

  // --- LÓGICA DE CHOFER MEJORADA ---
  // Se usa el campo `apellido_nombre` del nuevo tipo `AlarmDriver`.
  // Se provee un texto por defecto claro si no hay chofer asignado.
  const driverName = alarm.driver?.apellido_nombre || "Sin Asignar";
  const driverIcon = alarm.driver ? <User className="h-4 w-4 text-primary" /> : <ShieldAlert className="h-4 w-4 text-muted-foreground" />;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card text-card-foreground rounded-lg border border-l-4 p-4 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        statusBorderClass
      )}
      tabIndex={0} // Hacemos el div enfocable para accesibilidad
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      {/* Sección Superior: Tipo de Alarma y Hora */}
      <div className="flex justify-between items-start mb-3">
        <Badge variant={typeColorVariant} className="font-semibold text-xs md:text-sm">
          {alarm.type}
        </Badge>
        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatCorrectedTimestamp(alarm.timestamp, { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {/* Sección Media: Información de Chofer y Vehículo */}
      <div className="space-y-1.5 text-sm mb-4">
        <div className="flex items-center gap-2 font-medium truncate" title={driverName}>
          {driverIcon}
          <span className="truncate">{driverName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground truncate" title={`${alarm.vehicle?.interno || 'N/A'} - ${alarm.vehicle?.licensePlate || 'N/A'}`}>
          <CarFront className="h-4 w-4 flex-shrink-0" /> 
          <span className="truncate">{alarm.vehicle?.interno || 'N/A'} - {alarm.vehicle?.licensePlate || 'N/A'}</span>
        </div>
      </div>
       
      {/* Sección Inferior: Fecha y Estado */}
      <div className="flex justify-between items-center text-xs border-t pt-2 mt-2">
          <span className="text-muted-foreground flex items-center gap-1">
             <Clock className="h-3 w-3" />
             {formatCorrectedTimestamp(alarm.timestamp, { dateStyle: 'short' })}
          </span>
          <Badge variant={statusInfo.variant as any} className="capitalize">
            {statusInfo.label}
          </Badge>
      </div>
    </div>
  );
}