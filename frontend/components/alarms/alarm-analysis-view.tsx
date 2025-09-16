"use client";

import { Alarm } from "@/types";
import { Button } from "@/components/ui/button";
// IMPORTANTE: Añade el nuevo icono para el botón de deshacer
import { Loader2, Play, Undo2 } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { getColorVariantForType } from "@/lib/utils";
import Image from "next/image";

interface AlarmAnalysisViewProps {
  alarm: Alarm;
  onAction: (action: 'confirmed' | 'rejected' | 'skip') => void;
  isSubmitting: boolean;
  current: number;
  total: number;
  confirmText?: string;
  // --- INICIO DE LA SOLUCIÓN: Nuevas props para la funcionalidad de deshacer ---
  onUndo: () => void;
  isUndoDisabled: boolean;
  // --- FIN DE LA SOLUCIÓN ---
}

export function AlarmAnalysisView({ 
    alarm, 
    onAction, 
    isSubmitting, 
    current, 
    total, 
    confirmText,
    // --- INICIO DE LA SOLUCIÓN: Recibimos las nuevas props ---
    onUndo,
    isUndoDisabled
    // --- FIN DE LA SOLUCIÓN ---
}: AlarmAnalysisViewProps) {
  const role = typeof document !== 'undefined'
    ? (document.cookie.split('; ').find(c => c.startsWith('role='))?.split('=')[1] || 'USER')
    : 'USER';
  const primaryMedia = alarm.media?.find(m => m.type === 'video') || alarm.media?.[0];
  const typeColorVariant = getColorVariantForType(alarm.type);

  // Determinar qué botones mostrar según el rol y estado de la alarma
  const showActions = role === 'USER' ? alarm.status === 'pending' : true;
  const canReject = role === 'USER' ? alarm.status === 'pending' : true;
  const canConfirm = role === 'USER' ? alarm.status === 'pending' : true;

  return (
    <div className="flex flex-col h-full w-full items-center p-4">
      <div className="flex w-full justify-between items-center mb-1 relative">
        {/* --- INICIO DE LA SOLUCIÓN: Contenedor para el botón de deshacer a la izquierda --- */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              onClick={onUndo}
              disabled={isUndoDisabled}
              aria-label="Deshacer última acción"
              className="h-10 px-4" // Adjusted class to allow for text
            >
              <Undo2 className="h-5 w-5 mr-2" /> {/* Added mr-2 for spacing */}
              Deshacer última acción
            </Button>
        </div>
        {/* --- FIN DE LA SOLUCIÓN --- */}
        
        <div className="flex-grow text-center">
            <h2 className="text-2xl md:text-4xl font-bold">{alarm.type}</h2>
        </div>
      </div>

      <p className="text-muted-foreground mb-4">Analizando alarma {current} de {total}</p>

      <div className="relative w-full flex-grow bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center mb-6 border">
        {primaryMedia ? (
          <>
            {primaryMedia.type === 'video' ? (
              <video
                key={primaryMedia.id}
                src={primaryMedia.url}
                controls
                autoPlay
                muted
                loop
                className="w-full h-full object-contain"
              >
                Tu navegador no soporta el tag de video.
              </video>
            ) : (
              <Image
                src={primaryMedia.url}
                alt={`Evidencia de ${alarm.type}`}
                className="w-full h-full object-contain"
                width={800}
                height={600}
                unoptimized
              />
            )}
          </>
        ) : (
          <p className="text-muted-foreground">No hay evidencia multimedia para esta alarma.</p>
        )}
      </div>
      
      <div className="mb-4">
        <Badge variant={typeColorVariant} className="text-lg px-4 py-2">
          {alarm.type}
        </Badge>
      </div>

      {showActions && (
        <div className="grid grid-cols-3 gap-4 w-full max-w-lg flex-shrink-0">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => onAction('rejected')}
            disabled={isSubmitting || !canReject}
            className="h-14 text-lg"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Rechazar'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onAction('skip')}
            disabled={isSubmitting}
            className="h-14 text-lg"
          >
            Omitir
          </Button>
          <Button
            variant="success"
            size="lg"
            onClick={() => onAction('confirmed')}
            disabled={isSubmitting || !canConfirm}
            className="h-14 text-lg"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (confirmText || 'Confirmar')}
          </Button>
        </div>
      )}

      {!showActions && (
        <div className="text-center text-muted-foreground">
          <p>Esta alarma está en estado {alarm.status === 'suspicious' ? 'sospechosa' : alarm.status} y solo puede ser visualizada.</p>
        </div>
      )}
    </div>
  );
}