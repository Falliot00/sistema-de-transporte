// frontend/components/alarms/alarm-action-form.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2, X, UserSquare } from 'lucide-react';
import { Alarm, Driver } from '@/types';
import { getDrivers, assignDriver } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  const [description, setDescription] = useState(initialDescription || alarm.descripcion || "");
  const [isDescOpen, setIsDescOpen] = useState(false);
  const [isDriverOpen, setIsDriverOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(
    // CORRECCIÓN: Comprueba si 'alarm.driver' existe antes de acceder a 'id'
    alarm.driver && alarm.driver.id !== 'chofer-no-asignado' ? alarm.driver.id : undefined
  );
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setDescription(initialDescription || alarm.descripcion || "");
    setSelectedDriverId(
      // CORRECCIÓN: Comprueba si 'alarm.driver' existe antes de acceder a 'id'
      alarm.driver && alarm.driver.id !== 'chofer-no-asignado' ? alarm.driver.id : undefined
    );
  }, [alarm, initialDescription]);

  useEffect(() => {
    if (showDriverSelector) {
      const fetchDrivers = async () => {
        setIsLoadingDrivers(true);
        try {
          const allDrivers = await getDrivers();
          // CORRECCIÓN: Filtra por 'alarm.company' de forma segura
          const companyDrivers = allDrivers.filter(d => d.empresa === alarm.company);
          setDrivers(companyDrivers);
        } catch (error) {
          toast({ title: "Error", description: "No se pudieron cargar los choferes.", variant: "destructive" });
        } finally {
          setIsLoadingDrivers(false);
        }
      };
      fetchDrivers();
    }
  }, [showDriverSelector, alarm.company, toast]);

  const handleAction = (action: 'confirmed' | 'rejected') => {
    if (action === 'confirmed' && alarm.status === 'suspicious' && !selectedDriverId) {
        toast({ title: "Asignación Requerida", description: "Debes asignar un chofer para confirmar una alarma sospechosa.", variant: "destructive" });
        return;
    }
    onAction({ action, description, choferId: selectedDriverId ? parseInt(selectedDriverId, 10) : undefined });
  };

  const handleDriverChange = async (driverId: string) => {
    const newDriverId = driverId === "none" ? null : parseInt(driverId, 10);
    const previousDriverId = selectedDriverId;
    setSelectedDriverId(newDriverId?.toString());
    setIsDriverOpen(false);
    setIsAssigningDriver(true);

    try {
        await assignDriver(alarm.id, newDriverId);
        toast({ title: "Éxito", description: newDriverId !== null ? "Chofer asignado correctamente." : "Se ha quitado la asignación del chofer." });
    } catch (error: any) {
        setSelectedDriverId(previousDriverId);
        toast({ title: "Error", description: error.message || "No se pudo asignar el chofer.", variant: "destructive" });
    } finally {
        setIsAssigningDriver(false);
    }
  };

  const selectedDriverName = useMemo(() => {
    if (!selectedDriverId) return "Sin Asignar";
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
              {isAssigningDriver ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : selectedDriverName}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2 animate-in fade-in-0 zoom-in-95">
            <Select onValueChange={handleDriverChange} disabled={isLoadingDrivers || isAssigningDriver}>
                <SelectTrigger id="driver-selector">
                    <SelectValue placeholder={isLoadingDrivers ? "Cargando..." : "Cambiar chofer"} />
                </SelectTrigger>
                <SelectContent>
                {isLoadingDrivers ? (
                    <div className="flex items-center justify-center p-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                    <>
                        <SelectItem value="none" className="text-destructive">
                            <div className="flex items-center"><X className="h-4 w-4 mr-2" />Quitar asignación</div>
                        </SelectItem>
                        {drivers.map(driver => (
                            <SelectItem key={driver.choferes_id} value={driver.choferes_id.toString()}>
                                {driver.nombre} {driver.apellido}
                            </SelectItem>
                        ))}
                    </>
                )}
                </SelectContent>
            </Select>
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
          <Textarea id="description" placeholder="Añade detalles sobre tu decisión..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" disabled={isSubmitting}/>
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-4">
        <h4 className="font-semibold text-md mb-2">Acciones de Revisión</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button onClick={() => handleAction('rejected')} variant="destructive" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : rejectText}
          </Button>
          <Button onClick={() => handleAction('confirmed')} variant="success" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}