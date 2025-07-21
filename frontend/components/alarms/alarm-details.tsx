// frontend/components/alarms/alarm-details.tsx
"use client";

import dynamic from 'next/dynamic';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Alarm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlarmMedia } from "./alarm-media";
import { AlarmActionForm } from "./alarm-action-form";
import { 
  Clock, CarFront, User, FileText, MapPin, Gauge, Building, Camera, 
  Hash, ShieldAlert, Settings
} from "lucide-react";
import { getAlarmStatusInfo, formatCorrectedTimestamp } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { Button } from '../ui/button';

const AlarmLocationMap = dynamic(() => import('./alarm-location-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
});

interface AlarmDetailsProps {
  alarm: Alarm;
  current?: number;
  total?: number;
  onAction?: (payload: { 
    action: 'confirmed' | 'rejected', 
    description: string, 
    choferId?: number | null, 
    anomalyId?: number | null 
  }) => void;
  isSubmitting?: boolean;
  showActions?: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  ref: React.RefObject<HTMLDivElement>;
}

export function AlarmDetails({ 
  alarm, 
  current, 
  total, 
  onAction,
  isSubmitting = false,
  showActions = false
}: AlarmDetailsProps) {
  const statusInfo = getAlarmStatusInfo(alarm.status);
  const [activeSection, setActiveSection] = useState<string>('informacion-evento');

  const informacionRef = useRef<HTMLDivElement>(null);
  const multimediaRef = useRef<HTMLDivElement>(null);
  const descripcionRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const navigationItems: NavigationItem[] = useMemo(() => {
    const items = [
      {
        id: 'informacion-evento',
        label: 'Información del Evento',
        icon: <Hash className="h-4 w-4" />,
        ref: informacionRef
      },
      {
        id: 'multimedia',
        label: 'Evidencia Multimedia',
        icon: <Camera className="h-4 w-4" />,
        ref: multimediaRef
      }
    ];

    if (alarm.descripcion) {
      items.push({
        id: 'descripcion',
        label: 'Descripción Adicional',
        icon: <FileText className="h-4 w-4" />,
        ref: descripcionRef
      });
    }

    // Agregar sección de acciones si es necesario
    if (showActions && (alarm.status === 'pending' || alarm.status === 'suspicious' || alarm.status === 'rejected')) {
      items.push({
        id: 'acciones',
        label: 'Acciones de Revisión',
        icon: <Settings className="h-4 w-4" />,
        ref: actionsRef
      });
    }

    return items;
  }, [alarm.descripcion, alarm.status, showActions]);

  const position = useMemo((): [number, number] | null => {
    if (alarm?.location?.latitude && alarm?.location?.longitude) {
      return [alarm.location.latitude, alarm.location.longitude];
    }
    return null;
  }, [alarm?.location]);

  const getScrollContainer = (): HTMLElement => {
    let element = containerRef.current?.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return element;
      }
      element = element.parentElement;
    }
    return document.documentElement;
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const scrollContainer = getScrollContainer();
    
    navigationItems.forEach(item => {
      if (item.ref.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                setActiveSection(item.id);
              }
            });
          },
          {
            root: scrollContainer === document.documentElement ? null : scrollContainer,
            rootMargin: '-20% 0px -70% 0px',
            threshold: [0, 0.25, 0.5, 0.75, 1]
          }
        );
        observer.observe(item.ref.current);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [navigationItems]);

  const scrollToSection = (sectionId: string) => {
    const item = navigationItems.find(item => item.id === sectionId);
    if (!item?.ref.current) return;

    const scrollContainer = getScrollContainer();
    const targetElement = item.ref.current;
    
    if (scrollContainer === document.documentElement) {
      const headerOffset = 120;
      const elementPosition = targetElement.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      const headerOffset = 80;
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = targetElement.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const targetScrollTop = scrollTop + elementRect.top - containerRect.top - headerOffset;
      
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
    
    setActiveSection(sectionId);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6 relative">
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow">
            <h1 className="text-2xl font-bold tracking-tight">{alarm.type}</h1>
            <p className="text-muted-foreground mt-1">
              {formatCorrectedTimestamp(alarm.timestamp, { dateStyle: 'full', timeStyle: 'medium' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 min-w-[90px]">
            <Badge variant={statusInfo.variant as any} className="capitalize text-sm px-3 py-1 flex-shrink-0">
              {statusInfo.label}
            </Badge>
            {typeof current === 'number' && typeof total === 'number' && total > 0 && (
              <div className="text-sm text-muted-foreground font-medium">
                {current} / {total}
              </div>
            )}
          </div>
        </div>

        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm flex flex-wrap items-center gap-2 border-b pb-4 pt-2 -mx-6 px-6">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              variant="ghost"
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Card ref={informacionRef} id="informacion-evento" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Información del Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
          <div className="space-y-4">
            <InfoItem 
              icon={<Clock className="h-4 w-4" />} 
              label="Fecha y Hora" 
              value={formatCorrectedTimestamp(alarm.timestamp, { dateStyle: 'long', timeStyle: 'medium' })} 
            />
            <InfoItem 
              icon={<Building className="h-4 w-4" />} 
              label="Empresa" 
              value={alarm.company} 
            />
            <InfoItem 
              icon={alarm.driver ? <User className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />} 
              label="Chofer Asignado" 
              value={alarm.driver ? alarm.driver.apellido_nombre : "Sin Asignar"} 
            />
            <InfoItem 
              icon={<CarFront className="h-4 w-4" />} 
              label="Vehículo" 
              value={`${alarm.vehicle?.interno || 'N/A'} - ${alarm.vehicle?.licensePlate || 'N/A'}`} 
            />
            <InfoItem 
              icon={<Gauge className="h-4 w-4" />} 
              label="Velocidad" 
              value={typeof alarm.speed === 'number' ? `${Math.round(alarm.speed)} km/h` : 'No disponible'} 
            />
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
        <Card ref={descripcionRef} id="descripcion" className="scroll-mt-24">
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

      <Card ref={multimediaRef} id="multimedia" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5"/>
            Evidencia Multimedia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlarmMedia alarmId={alarm.id} media={alarm.media || []} videoProcessing={alarm.videoProcessing} />
        </CardContent>
      </Card>

      {/* Nueva sección de acciones integrada como Card */}
      {showActions && onAction && (alarm.status === 'pending' || alarm.status === 'suspicious' || alarm.status === 'rejected') && (
        <Card ref={actionsRef} id="acciones" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary"/>
              Acciones de Revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alarm.status === 'rejected' ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Esta alarma fue rechazada previamente. Puedes re-evaluarla si consideras que requiere una segunda revisión.
                  </p>
                </div>
                <AlarmActionForm
                  alarm={alarm}
                  onAction={(payload) => {
                    // Para alarmas rechazadas, solo permitimos re-evaluación
                    if (payload.action === 'confirmed') {
                      onAction({ ...payload, action: 'confirmed' });
                    }
                  }}
                  isSubmitting={isSubmitting}
                  confirmText="Marcar como Sospechosa"
                  rejectText="Mantener Rechazada"
                  initialDescription={alarm.descripcion || ''}
                  showDriverSelector={false}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {alarm.status === 'pending' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Revisa la evidencia y decide si esta alarma requiere mayor investigación o puede ser descartada.
                    </p>
                  </div>
                )}
                {alarm.status === 'suspicious' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Esta alarma está marcada como sospechosa. Asigna un chofer y una anomalía para confirmarla, o recházala si fue un falso positivo.
                    </p>
                  </div>
                )}
                <AlarmActionForm
                  alarm={alarm}
                  onAction={onAction}
                  isSubmitting={isSubmitting}
                  confirmText={alarm.status === 'pending' ? 'Marcar como Sospechosa' : 'Confirmar Alarma'}
                  initialDescription={alarm.descripcion || ''}
                  showDriverSelector={true}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
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