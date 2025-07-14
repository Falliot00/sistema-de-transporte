// frontend/components/alarms/alarm-action-form.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlusCircle, Loader2 } from 'lucide-react';
import { Alarm } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DriverSelector } from './driver-selector';

interface AlarmActionFormProps {
  alarm: Alarm;
  // SOLUCIÓN: La prop onAction ahora acepta que choferId pueda ser null.
  onAction: (payload: { action: 'confirmed' | 'rejected', description: string, choferId?: number | null }) => void;
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
  const [selectedDriverId, setSelectedDriverId] = useState<number | null | undefined>(
    alarm.driver ? Number(alarm.driver.id) : null
  );
  const { toast } = useToast();

  useEffect(() => {
    setDescription(initialDescription || alarm.descripcion || "");
    setSelectedDriverId(alarm.driver ? Number(alarm.driver.id) : null);
  }, [alarm, initialDescription]);

  const handleAction = (action: 'confirmed' | 'rejected') => {
    if (action === 'confirmed' && alarm.status === 'suspicious' && selectedDriverId === null) {
        toast({ title: "Asignación Requerida", description: "Debes asignar un chofer para confirmar una alarma sospechosa.", variant: "destructive" });
        return;
    }
    onAction({ action, description, choferId: selectedDriverId });
  };

  return (
    <div className="space-y-4">
      {showDriverSelector && (
        <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                Asignar Chofer
            </label>
            <DriverSelector
                selectedDriverId={selectedDriverId}
                onSelectDriver={(driverId) => setSelectedDriverId(driverId)}
                alarmCompany={alarm.company}
                disabled={isSubmitting}
            />
        </div>
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