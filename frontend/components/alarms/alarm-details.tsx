// frontend/components/alarms/alarm-details.tsx

"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmMedia } from "./alarm-media";
import { AlarmReview } from "./alarm-review"; // Suponiendo que este componente existe y funciona
import { Clock, MapPin, User, CarFront, Smartphone, AlertTriangle } from "lucide-react";

// Helper para formatear la fecha
function formatTimestamp(dateString?: string): string {
    if (!dateString) return "Fecha no disponible";
    return new Date(dateString).toLocaleString('es-AR', {
        dateStyle: 'full',
        timeStyle: 'medium',
    });
}

// Helper para el color del badge de estado
function getStatusBadgeVariant(status?: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "confirmed": return "default";
    case "rejected": return "destructive";
    case "pending":
    default:
      return "secondary";
  }
}

interface AlarmDetailsProps {
  alarm: Alarm | null;
  onAlarmUpdate: (updatedAlarm: Alarm) => void;
}

export function AlarmDetails({ alarm, onAlarmUpdate }: AlarmDetailsProps) {
  // Muestra un estado vacío si no hay alarma seleccionada
  if (!alarm) {
    return (
      <Card className="h-full flex items-center justify-center bg-muted/50">
        <div className="text-center p-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No hay alarma seleccionada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Haz clic en una alarma de la lista para ver sus detalles.
          </p>
        </div>
      </Card>
    );
  }

  // Renderiza la tarjeta de detalles completa
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div>
                <CardTitle className="text-xl mb-1">{alarm.type}</CardTitle>
                <CardDescription>Vehículo: {alarm.vehicle.licensePlate}</CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(alarm.status)} className="capitalize text-sm px-3 py-1">
                {alarm.status}
            </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
            <h4 className="font-semibold">Evidencia Multimedia</h4>
            <AlarmMedia media={alarm.media} />
        </div>
        <div className="flex flex-col gap-4">
            <h4 className="font-semibold">Detalles del Evento</h4>
            <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-muted-foreground" /><span>{formatTimestamp(alarm.timestamp)}</span></div>
                <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-muted-foreground mt-1" /><span>{alarm.location.address}</span></div>
                <div className="flex items-center gap-3"><User className="h-5 w-5 text-muted-foreground" /><span>Chofer: {alarm.driver.name}</span></div>
                <div className="flex items-center gap-3"><CarFront className="h-5 w-5 text-muted-foreground" /><span>Vehículo: {alarm.vehicle.model}</span></div>
                <div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-muted-foreground" /><span>Dispositivo: {alarm.device.name}</span></div>
            </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/20 p-4 border-t">
        <div className="w-full flex justify-end">
            <AlarmReview alarm={alarm} onAlarmReviewed={onAlarmUpdate} />
        </div>
      </CardFooter>
    </Card>
  );
}