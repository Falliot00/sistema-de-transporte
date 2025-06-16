"use client";

import { Alarm } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// --- INICIO DE LA SOLUCIÓN ---
interface AlarmAnalysisViewProps {
  alarm: Alarm;
  onAction: (action: 'confirmed' | 'rejected' | 'skip') => void;
  isSubmitting: boolean;
  current: number;
  total: number;
  confirmText?: string; // Nueva prop para el texto del botón
}

export function AlarmAnalysisView({ alarm, onAction, isSubmitting, current, total, confirmText }: AlarmAnalysisViewProps) {
  const primaryMedia = alarm.media?.find(m => m.type === 'video') || alarm.media?.[0];

  return (
    <div className="flex flex-col h-full w-full items-center p-4">
      <h2 className="text-2xl md:text-4xl font-bold text-center mb-1">{alarm.type}</h2>
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
          {/* El texto del botón ahora es dinámico */}
          {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (confirmText || 'Confirmar')}
        </Button>
      </div>
    </div>
  );
}
// --- FIN DE LA SOLUCIÓN ---