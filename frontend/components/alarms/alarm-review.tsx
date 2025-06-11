// frontend/components/alarms/alarm-review.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { reviewAlarm } from "@/lib/api"; // Usamos la función de la API que creamos
import { Alarm } from "@/types";

interface AlarmReviewProps {
  alarm: Alarm;
  onAlarmReviewed: (updatedAlarm: Alarm) => void; // Callback para actualizar la UI
}

export function AlarmReview({ alarm, onAlarmReviewed }: AlarmReviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (status: 'confirmed' | 'rejected') => {
    try {
      const updatedAlarm = await reviewAlarm(alarm.id, status);
      toast({
        title: "Alarma Actualizada",
        description: `La alarma ha sido marcada como ${status}.`,
      });
      onAlarmReviewed(updatedAlarm); // Notifica al componente padre del cambio
      setIsOpen(false); // Cierra el diálogo
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la alarma.",
        variant: "destructive",
      });
    }
  };

  return (
    // El componente <Dialog> envuelve todo
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">Revisar Alarma</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Revisar Alarma: {alarm.vehicle.licensePlate}</DialogTitle>
          <DialogDescription>
            Añada un comentario y luego confirme o rechace la alarma.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Escribe tu comentario aquí..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={() => handleSubmit('rejected')}>
            Rechazar
          </Button>
          <Button variant="default" onClick={() => handleSubmit('confirmed')}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}