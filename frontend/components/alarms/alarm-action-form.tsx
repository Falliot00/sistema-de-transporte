// frontend/components/alarms/alarm-action-form.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2 } from 'lucide-react';
import { Alarm, Driver } from '@/types';
import { getDrivers } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AlarmActionFormProps {
  alarm: Alarm; // Se necesita la alarma completa para obtener la empresa y el chofer inicial
  onAction: (payload: { action: 'confirmed' | 'rejected', description: string, choferId?: number }) => void;
  isSubmitting: boolean;
  confirmText?: string;
  rejectText?: string;
  initialDescription?: string;
  showDriverSelector: boolean; // Prop para controlar si se muestra el selector
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
  const [isOpen, setIsOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(alarm.driver.id);
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
          toast({
            title: "Error de Red",
            description: "No se pudieron cargar los choferes.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingDrivers(false);
        }
      };
      fetchDrivers();
    }
  }, [showDriverSelector, alarm.company, toast]);

  const handleAction = (action: 'confirmed' | 'rejected') => {
    // CRITICAL VALIDATION: Si se requiere selector y no se ha elegido un chofer, bloquear la acción.
    if (action === 'confirmed' && showDriverSelector && !selectedDriverId) {
      toast({
        title: "Acción Requerida",
        description: "Por favor, selecciona un chofer antes de confirmar.",
        variant: "destructive",
      });
      return;
    }
    
    onAction({
      action,
      description,
      choferId: selectedDriverId ? parseInt(selectedDriverId, 10) : undefined
    });
  };

  return (
    <div className="space-y-4">
      {showDriverSelector && (
        <div className="space-y-2">
          <Label htmlFor="driver-selector" className="font-semibold">Asignar Chofer</Label>
          <Select
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            disabled={isLoadingDrivers || isSubmitting}
          >
            <SelectTrigger id="driver-selector">
              <SelectValue placeholder={isLoadingDrivers ? "Cargando choferes..." : "Seleccionar un chofer"} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingDrivers ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : drivers.length > 0 ? (
                drivers.map(driver => (
                  <SelectItem key={driver.choferes_id} value={driver.choferes_id.toString()}>
                    {driver.nombre} {driver.apellido}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No hay choferes en esta empresa.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            {isOpen ? "Ocultar descripción" : (description ? "Ver/Editar Descripción" : "Añadir Descripción (Opcional)")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-4 animate-in fade-in-0 zoom-in-95">
          <Label htmlFor="description" className="font-semibold">Descripción de la Acción</Label>
          <Textarea
            id="description"
            placeholder="Añade detalles sobre tu decisión..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
            disabled={isSubmitting}
          />
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-4">
        <h4 className="font-semibold text-md mb-2">Acciones de Revisión</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={() => handleAction('rejected')}
            variant="destructive"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : rejectText}
          </Button>
          <Button
            onClick={() => handleAction('confirmed')}
            variant="success"
            className="w-full"
            disabled={isSubmitting || (showDriverSelector && !selectedDriverId)}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}