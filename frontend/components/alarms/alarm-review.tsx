"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlarmReviewProps {
  onReview: (status: 'confirmed' | 'rejected') => void;
  isSubmitting: boolean;
}

export function AlarmReview({ onReview, isSubmitting }: AlarmReviewProps) {
  return (
    // --- INICIO DE LA SOLUCIÓN ---
    // Quitamos la tarjeta (Card) para que el componente sea más flexible
    // y aplicamos un layout de grilla para los botones.
    <div>
        <h4 className="font-semibold text-md mb-2">Acciones de Revisión</h4>
        <p className="text-sm text-muted-foreground mb-4">
            Confirma si esta alarma es una amenaza real o si debe ser rechazada.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
                onClick={() => onReview('rejected')}
                variant="destructive"
                className="w-full"
                disabled={isSubmitting}
            >
                Rechazar
            </Button>
            <Button
                onClick={() => onReview('confirmed')}
                variant="success"
                className="w-full"
                disabled={isSubmitting}
            >
                Marcar como Sospechosa
            </Button>
        </div>
    </div>
    // --- FIN DE LA SOLUCIÓN ---
  );
}