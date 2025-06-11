// frontend/components/alarms/alarm-details.tsx
// (El código es el mismo que en la respuesta anterior, completo y funcional)

"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmMedia } from "./alarm-media";
import { AlarmReview } from "./alarm-review";
import { Clock, MapPin, User, CarFront, Smartphone, AlertTriangle } from "lucide-react";

function getAlarmTypeDescription(type: number | undefined): string {
  switch (type) {
    case 1: return "Exceso de Velocidad";
    case 2: return "Frenada Brusca";
    case 3: return "Aceleración Súbita";
    case 4: return "Uso Fuera de Horario";
    default: return "Alarma Desconocida";
  }
}

function getStatusBadgeVariant(status: string | undefined): "default" | "secondary" | "destructive" {
  switch (status) {
    case "confirmed": return "default";
    case "rejected": return "destructive";
    case "pending":
    default:
      return "secondary";
  }
}

function formatTimestamp(dateString: string | undefined): string {
    if (!dateString) return "Fecha no disponible";
    return new Date(dateString).toLocaleString('es-AR', {
        dateStyle: 'long',
        timeStyle: 'short',
    });
}

interface AlarmDetailsProps {
  alarm: Alarm | null;
  onAlarmUpdate: (updatedAlarm: Alarm) => void;
}

export function AlarmDetails({ alarm, onAlarmUpdate }: AlarmDetailsProps) {
  if (!alarm) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay alarma seleccionada
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Haz clic en una alarma de la lista para ver sus detalles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl mb-1">{getAlarmTypeDescription(alarm.type)}</CardTitle>
                <CardDescription>
                    Vehículo: {alarm.vehicle.licensePlate}
                </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(alarm.status)} className="capitalize">
                {alarm.status}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
            <h4 className="font-semibold">Evidencia Multimedia</h4>
            <AlarmMedia media={alarm.media} />
        </div>
        <div className="flex flex-col gap-4">
            <h4 className="font-semibold">Detalles del Evento</h4>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>{formatTimestamp(alarm.timestamp)}</span>
                </div>
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                    <span>{alarm.location.address}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <span>Chofer: {alarm.driver.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    <CarFront className="h-5 w-5 text-gray-500" />
                    <span>Vehículo: {alarm.vehicle.model}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    <span>Dispositivo: {alarm.device.name}</span>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t">
        <div className="w-full flex justify-end">
            <AlarmReview alarm={alarm} onAlarmReviewed={onAlarmUpdate} />
        </div>
      </CardFooter>
    </Card>
  );
}