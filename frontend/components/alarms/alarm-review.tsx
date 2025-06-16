"use client";

import { Button } from "@/components/ui/button";

// --- INICIO DE LA SOLUCIÓN ---
interface AlarmReviewProps {
  onReview: (status: 'confirmed' | 'rejected') => void;
  isSubmitting: boolean;
  confirmText?: string;
  rejectText?: string;
}

export function AlarmReview({
  onReview,
  isSubmitting,
  confirmText = "Marcar como Sospechosa",
  rejectText = "Rechazar"
}: AlarmReviewProps) {
  return (
    <div>
        <h4 className="font-semibold text-md mb-2">Acciones de Revisión</h4>
        <p className="text-sm text-muted-foreground mb-4">
            Evalúa la alarma y selecciona una acción. Esta decisión puede ser reevaluada más tarde si es necesario.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
                onClick={() => onReview('rejected')}
                variant="destructive"
                className="w-full"
                disabled={isSubmitting}
            >
                {rejectText}
            </Button>
            <Button
                onClick={() => onReview('confirmed')}
                variant="success"
                className="w-full"
                disabled={isSubmitting}
            >
                {confirmText}
            </Button>
        </div>
    </div>
  );
}
// --- FIN DE LA SOLUCIÓN ---