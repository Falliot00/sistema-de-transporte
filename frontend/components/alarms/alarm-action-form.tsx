// frontend/components/alarms/alarm-action-form.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlusCircle } from 'lucide-react';

interface AlarmActionFormProps {
  onAction: (payload: { action: 'confirmed' | 'rejected', description: string }) => void;
  isSubmitting: boolean;
  confirmText?: string;
  rejectText?: string;
  initialDescription?: string;
}

export function AlarmActionForm({
  onAction,
  isSubmitting,
  confirmText = "Confirmar",
  rejectText = "Rechazar",
  initialDescription = ""
}: AlarmActionFormProps) {
  const [description, setDescription] = useState(initialDescription);
  
  // --- INICIO DE LA SOLUCIÓN ---
  // Se inicializa el estado `isOpen` siempre en `false` para que el campo
  // de descripción aparezca cerrado por defecto, incluso si ya existe un texto.
  const [isOpen, setIsOpen] = useState(false);
  // --- FIN DE LA SOLUCIÓN ---

  const handleReject = () => {
    if (rejectText !== "Mantener Rechazada") {
        onAction({ action: 'rejected', description });
    } else {
        onAction({ action: 'rejected', description: "" });
    }
  };

  const handleConfirm = () => {
    onAction({ action: 'confirmed', description });
  };

  return (
    <div className="space-y-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {/* El texto del botón ahora cambia para reflejar si hay contenido o no */}
                    {isOpen ? "Ocultar descripción" : (description ? "Ver/Editar Descripción" : "Añadir Descripción (Opcional)")}
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-4 animate-in fade-in-0 zoom-in-95">
                <Label htmlFor="description" className="font-semibold">Descripción</Label>
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
                    onClick={handleReject}
                    variant="destructive"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {rejectText}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="success"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {confirmText}
                </Button>
            </div>
        </div>
    </div>
  );
}