// frontend/components/alarms/alarm-action-form.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2, Check, X, UserSquare } from 'lucide-react';
import { Alarm, Driver } from '@/types';
import { getDrivers } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AlarmActionFormProps {
  alarm: Alarm;
  onAction: (payload: { action: 'confirmed' | 'rejected', description: string, choferId?: number }) => void;
  isSubmitting: boolean;
  confirmText?: string;
  rejectText?: string;
  initialDescription?: string;
  showDriverSelector: boolean;
}

export function AlarmActionForm({
  alarm,
  onAction,
  isSubmitting,
  confirmText = "Confirmar",
  rejectText = "Rechazar",
  initialDescription = "",
  showDriverSelector,
}: AlarmActionFormProps) {
  const [description, setDescription] = useState(initialDescription);
  const [isDescOpen, setIsDescOpen] = useState(false);
  const [isDriverOpen, setIsDriverOpen] = useState(false);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(alarm.driver.id !== 'chofer-no-asignado' ? alarm.driver.id : undefined);
  const [pendingDriverId, setPendingDriverId] = useState<string | undefined>();

  const { toast } = useToast();

  useEffect(() => {
    if (showDriverSelector) {
      const fetchDrivers = async () => {
        setIsLoadingDrivers(true);
        try {
          const allDrivers = await getDrivers();
          const companyDrivers = allDrivers.filter(d => d.empresa === alarm.company);
          setDrivers(companyDrivers);
        } catch (error) {
          console.error("Error al cargar los choferes:", error);
          toast({ title: "Error de Red", description: "No se pudieron cargar los choferes.", variant: "destructive" });
        } finally {
          setIsLoadingDrivers(false);
        }
      };
      fetchDrivers();
    }
  }, [showDriverSelector, alarm.company, toast]);

  const handleAction = (action: 'confirmed' | 'rejected') => {
    // CRITICAL: Lógica de validación movida aquí desde el botón.
    // Solo se bloquea si se intenta confirmar una alarma sospechosa sin chofer.
    if (action === 'confirmed' && alarm.status === 'suspicious' && !selectedDriverId) {
      toast({
        title: "Asignación Requerida",
        description: "Debes asignar un chofer para confirmar una alarma sospechosa.",
        variant: "destructive",
      });
      return; // Detiene la ejecución
    }
    
    onAction({ action, description, choferId: selectedDriverId ? parseInt(selectedDriverId, 10) : undefined });
  };

  const handleDriverSelect = (driverId: string) => setPendingDriverId(driverId);

  const handleConfirmDriverSelection = () => {
    setSelectedDriverId(pendingDriverId);
    setPendingDriverId(undefined);
    setIsDriverOpen(false);
  };

  const handleClearDriverSelection = () => {
    setPendingDriverId(undefined);
    setSelectedDriverId(undefined);
    setIsDriverOpen(false);
  };

  const selectedDriverName = useMemo(() => {
    const driver = drivers.find(d => d.choferes_id.toString() === selectedDriverId);
    return driver ? `${driver.nombre} ${driver.apellido}` : "Sin Asignar";
  }, [selectedDriverId, drivers]);

  return (
    <div className="space-y-2">
      {showDriverSelector && (
        <Collapsible open={isDriverOpen} onOpenChange={setIsDriverOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-0 h-auto font-normal text-sm text-muted-foreground hover:text-foreground justify-start w-full">
              <UserSquare className="mr-2 h-4 w-4" />
              <span className="font-semibold text-foreground mr-1">Asignar Chofer:</span>
              {selectedDriverName}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-2">
                <Select
                    value={pendingDriverId ?? selectedDriverId ?? ""}
                    onValueChange={handleDriverSelect}
                    disabled={isLoadingDrivers || isSubmitting}
                >
                    <SelectTrigger><SelectValue placeholder={isLoadingDrivers ? "Cargando..." : "Seleccionar chofer"} /></SelectTrigger>
                    <SelectContent>
                    {isLoadingDrivers ? (
                        <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                    ) : drivers.length > 0 ? (
                        drivers.map(driver => (
                        <SelectItem key={driver.choferes_id} value={driver.choferes_id.toString()}>
                            {driver.nombre} {driver.apellido}
                        </SelectItem>
                        ))
                    ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground">No hay choferes.</div>
                    )}
                    </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" onClick={handleClearDriverSelection} className="text-destructive hover:bg-destructive/10" aria-label="Limpiar selección">
                    <X className="h-5 w-5"/>
                </Button>

                {pendingDriverId && pendingDriverId !== selectedDriverId && (
                    <Button variant="ghost" size="icon" onClick={handleConfirmDriverSelection} className="text-green-600 hover:bg-green-500/10" aria-label="Confirmar selección">
                        <Check className="h-5 w-5"/>
                    </Button>
                )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible open={isDescOpen} onOpenChange={setIsDescOpen} className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            {isDescOpen ? "Ocultar descripción" : (description ? "Ver/Editar Descripción" : "Añadir Descripción")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2 animate-in fade-in-0 zoom-in-95">
          <Textarea
            id="description"
            placeholder="Añade detalles sobre tu decisión..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px]"
            disabled={isSubmitting}
          />
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-4">
        <h4 className="font-semibold text-md mb-2">Acciones de Revisión</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button onClick={() => handleAction('rejected')} variant="destructive" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : rejectText}
          </Button>
          {/* MODIFICADO: El botón ya no se deshabilita por la falta de chofer */}
          <Button onClick={() => handleAction('confirmed')} variant="success" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}