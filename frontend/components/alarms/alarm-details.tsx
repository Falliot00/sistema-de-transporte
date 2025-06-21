// frontend/components/alarms/alarm-details.tsx
"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmMedia } from "./alarm-media";
import { Clock, CarFront, User, FileText, MapPin, Gauge, ChevronLeft, ChevronRight } from "lucide-react";
import { getAlarmStatusInfo, formatCorrectedTimestamp } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const AlarmLocationMap = dynamic(() => import('./alarm-location-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
});

interface AlarmDetailsProps {
  alarm: Alarm;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  isNavigable?: boolean; // Prop para controlar la visibilidad de los botones
}

export function AlarmDetails({ 
    alarm, 
    onNext, 
    onPrevious, 
    hasNext, 
    hasPrevious, 
    isNavigable = false 
}: AlarmDetailsProps) {
  const statusInfo = getAlarmStatusInfo(alarm.status);

  const position = useMemo((): [number, number] | null => {
    if (alarm?.location?.latitude && alarm?.location?.longitude) {
      return [alarm.location.latitude, alarm.location.longitude];
    }
    return null;
  }, [alarm?.location]);

  return (
    <div className="flex flex-col gap-6 relative">
        {/* Los botones de navegación ahora se renderizan dentro del componente de detalles */}
        {isNavigable && (
            <>
                <Button variant="outline" size="icon" onClick={onPrevious} disabled={!hasPrevious} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 rounded-full h-10 w-10 bg-background/80 hover:bg-background z-10">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Anterior</span>
                </Button>
                <Button variant="outline" size="icon" onClick={onNext} disabled={!hasNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 rounded-full h-10 w-10 bg-background/80 hover:bg-background z-10">
                    <ChevronRight className="h-5 w-5" />
                    <span className="sr-only">Siguiente</span>
                </Button>
            </>
        )}
        
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
                    <InfoItem icon={<User className="h-4 w-4" />} label="Chofer Asignado" value={alarm.driver.name} />
                    <InfoItem icon={<FileText className="h-4 w-4" />} label="DNI" value={alarm.driver.license} />
                    <InfoItem icon={<CarFront className="h-4 w-4" />} label="Vehiculo (Interno)" value={alarm.vehicle.interno || 'N/A'} />
                    <InfoItem icon={<CarFront className="h-4 w-4" />} label="Patente" value={alarm.vehicle.licensePlate || 'N/A'} />
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