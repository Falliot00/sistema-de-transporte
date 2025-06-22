// frontend/components/alarms/alarm-details.tsx
"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmMedia } from "./alarm-media";
import { Clock, CarFront, User, FileText, MapPin, Gauge, Building } from "lucide-react";
import { getAlarmStatusInfo, formatCorrectedTimestamp } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';

const AlarmLocationMap = dynamic(() => import('./alarm-location-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
});

// --- INICIO DE LA SOLUCIÓN ---
// Se simplifica la interfaz, ya no maneja la navegación.
interface AlarmDetailsProps {
  alarm: Alarm;
}

export function AlarmDetails({ alarm }: AlarmDetailsProps) {
// --- FIN DE LA SOLUCIÓN ---
  const statusInfo = getAlarmStatusInfo(alarm.status);

  const position = useMemo((): [number, number] | null => {
    if (alarm?.location?.latitude && alarm?.location?.longitude) {
      return [alarm.location.latitude, alarm.location.longitude];
    }
    return null;
  }, [alarm?.location]);

  return (
    <div className="flex flex-col gap-6 relative">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-grow">
                 <CardTitle className="text-xl">
                    {alarm.type}
                 </CardTitle>
            </div>
            <Badge variant={statusInfo.variant as any} className="capitalize text-sm px-3 py-1 flex-shrink-0">{statusInfo.label}</Badge>
        </div>

        <Card>
            <CardHeader><CardTitle className="text-lg">Información del Evento</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                <div className="space-y-4">
                    <InfoItem icon={<Clock className="h-4 w-4" />} label="Fecha y Hora" value={formatCorrectedTimestamp(alarm.timestamp, { dateStyle: 'long', timeStyle: 'medium' })} />
                    <InfoItem icon={<Building className="h-4 w-4" />} label="Empresa" value={alarm.company} />
                    <InfoItem icon={<User className="h-4 w-4" />} label="Chofer Asignado" value={alarm.driver.name} />
                    <InfoItem icon={<FileText className="h-4 w-4" />} label="DNI" value={alarm.driver.license} />
                    <InfoItem icon={<CarFront className="h-4 w-4" />} label="Vehiculo" value={alarm.vehicle.interno + ' - ' + alarm.vehicle.licensePlate || 'N/A'} />
                    <InfoItem icon={<Gauge className="h-4 w-4" />} label="Velocidad" value={typeof alarm.speed === 'number' ? `${Math.round(alarm.speed)} km/h` : 'No disponible'} />
                </div>
                <div>
                  <div className="text-muted-foreground flex items-center gap-3 mb-2">
                      <MapPin className="h-4 w-4" />
                      <p className="text-xs text-muted-foreground font-medium">UBICACIÓN DEL EVENTO</p>
                  </div>
                  <div className="h-56 w-full rounded-md overflow-hidden border">
                      {position ? (
                          <AlarmLocationMap position={position} popupText={alarm.location.address || `Lat: ${position[0]}, Lng: ${position[1]}`} />
                      ) : (
                          <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">Ubicación no disponible.</div>
                      )}
                  </div>
                </div>
            </CardContent>
        </Card>

        {alarm.descripcion && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5"/>
                        Descripción Adicional
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{alarm.descripcion}</p>
                </CardContent>
            </Card>
        )}

        <div>
            <h4 className="font-semibold mb-2 text-lg">Evidencia Multimedia</h4>
            <div className="rounded-lg overflow-hidden border bg-muted/20 p-4">
                <AlarmMedia alarmId={alarm.id} media={alarm.media} videoProcessing={alarm.videoProcessing} />
            </div>
        </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-0.5">{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-sm">{value || "No disponible"}</p>
            </div>
        </div>
    );
}