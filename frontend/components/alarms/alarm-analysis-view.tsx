"use client";

import { Alarm } from "@/types";
import { Button } from "@/components/ui/button";
// IMPORTANTE: Añade el nuevo icono para el botón de deshacer
import { Loader2, Play, Undo2 } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { getColorVariantForType } from "@/lib/utils";

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
  const primaryMedia = alarm.media?.find(m => m.type === 'video') || alarm.media?.[0];
  const typeColorVariant = getColorVariantForType(alarm.type);

  return (
    <div className="flex flex-col h-full w-full items-center p-4">
      <div className="flex w-full justify-between items-center mb-1 relative">
        {/* --- INICIO DE LA SOLUCIÓN: Contenedor para el botón de deshacer a la izquierda --- */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={isUndoDisabled}
              aria-label="Deshacer última acción"
              className="h-10 w-10"
            >
              <Undo2 className="h-6 w-6" />
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
              <img
                src={primaryMedia.url}
                alt={`Evidencia de ${alarm.type}`}
                className="w-full h-full object-contain"
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

      <div className="grid grid-cols-3 gap-4 w-full max-w-lg flex-shrink-0">
        <Button
          variant="destructive"
          size="lg"
          onClick={() => onAction('rejected')}
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          className="h-14 text-lg"
        >
          {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (confirmText || 'Confirmar')}
        </Button>
      </div>
    </div>
  );
}