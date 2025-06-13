"use client";

import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmMedia } from "./alarm-media";
import { Clock, MapPin, User, CarFront, Smartphone, AlertCircle } from "lucide-react";
import { getAlarmStatusInfo } from "@/lib/utils";

// Componente auxiliar para mostrar información
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

// Función para formatear la fecha
function formatTimestamp(dateString?: string): string {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleString('es-AR', {
        dateStyle: 'long',
        timeStyle: 'medium',
    });
}

// --- INICIO DE LA SOLUCIÓN ---
// Quitamos las props 'onReview' y 'isSubmitting' que ya no son necesarias aquí.
interface AlarmDetailsProps {
  alarm: Alarm;
}

export function AlarmDetails({ alarm }: AlarmDetailsProps) {
// --- FIN DE LA SOLUCIÓN ---
  if (!alarm) {
    return <div className="text-center p-6 text-muted-foreground">No hay datos de alarma para mostrar.</div>;
  }

  const statusInfo = getAlarmStatusInfo(alarm.status);

  return (
    <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
            <div>
                <CardTitle className="text-xl mb-1 flex items-center gap-2">
                   <AlertCircle className="h-6 w-6 text-primary" /> {alarm.type}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Vehículo: {alarm.vehicle.licensePlate}</p>
            </div>
            <Badge variant={statusInfo.variant} className="capitalize text-sm px-3 py-1">{statusInfo.label}</Badge>
        </div>

        <div>
            <h4 className="font-semibold mb-2 text-lg">Evidencia Multimedia</h4>
            <div className="rounded-lg overflow-hidden border bg-muted/20"><AlarmMedia media={alarm.media} /></div>
        </div>

        <Card>
            <CardHeader><CardTitle className="text-lg">Información del Evento</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <InfoItem icon={<Clock className="h-4 w-4" />} label="Fecha y Hora" value={formatTimestamp(alarm.timestamp)} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Ubicación" value={alarm.location.address} />
                <InfoItem icon={<User className="h-4 w-4" />} label="Chofer" value={alarm.driver.name} />
                <InfoItem icon={<CarFront className="h-4 w-4" />} label="Modelo del Vehículo" value={alarm.vehicle.model} />
                <InfoItem icon={<Smartphone className="h-4 w-4" />} label="Dispositivo" value={alarm.device.name} />
            </CardContent>
        </Card>

        {/* --- INICIO DE LA SOLUCIÓN --- */}
        {/* La sección de revisión se ha movido al componente padre (AlarmsPage) */}
        {/* --- FIN DE LA SOLUCIÓN --- */}
    </div>
  );
}