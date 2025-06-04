// components/alarms/alarm-review.tsx
"use client";

import { useState, useEffect } from "react"; // useEffect might be needed if comment reset needs to be tied to alarm change
import { Alarm } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogTitle } // DialogTitle usually goes inside DialogHeader
from "@/components/ui/dialog"; 
import { Check, X, SkipForward } from "lucide-react";

interface AlarmReviewProps {
  alarm: Alarm;
  onConfirm: (alarm: Alarm, comment: string) => void;
  onReject: (alarm: Alarm, comment: string) => void;
  onSkip: (alarm: Alarm) => void;
  onClose: () => void;
  isLoading?: boolean;
  totalPending: number;
  currentIndex: number;
}

export function AlarmReview({ 
  alarm, 
  onConfirm, 
  onReject,
  onSkip, 
  onClose,
  isLoading = false,
  totalPending,
  currentIndex
}: AlarmReviewProps) {
  const [comment, setComment] = useState("");

  // Reset comment when the alarm prop changes
  useEffect(() => {
    setComment("");
  }, [alarm]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleConfirm = () => {
    onConfirm(alarm, comment);
    // Comment reset is now handled by useEffect when alarm changes
  };

  const handleReject = () => {
    onReject(alarm, comment);
    // Comment reset is now handled by useEffect
  };

  const handleSkip = () => {
    onSkip(alarm);
    // Comment reset is now handled by useEffect
  };

  const mainMedia = alarm.media[0];

  return (
    // Main container for AlarmReview, h-full allows it to take height from parent if parent has fixed height or flex-grow
    // In this case, the parent in DialogContent (div.p-6.flex-grow) allows it to grow.
    <div className="flex flex-col h-full"> 
      <DialogHeader className="mb-4">
        <div className="flex items-center justify-between">
            <DialogTitle>Revisión de Alarma: {alarm.id}</DialogTitle>
        </div>
        <p className="text-sm text-muted-foreground">
            Analizando alarma {currentIndex} de {totalPending}
        </p>
      </DialogHeader>

      {/* Content area - removed flex-1 and overflow-y-auto */}
      <div className="space-y-4"> 
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {mainMedia?.type === 'video' ? (
            <video
              key={mainMedia.url} // Key ensures video reloads if src changes
              src={mainMedia.url}
              controls
              autoPlay
              muted // Autoplay usually requires muted
              className="h-full w-full object-contain" // Changed to object-contain for better video visibility
            />
          ) : mainMedia?.url ? (
            <img
              src={mainMedia.url}
              alt="Evidencia de alarma"
              className="h-full w-full object-contain rounded-lg" // Changed to object-contain
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted rounded-lg aspect-video">
              Sin multimedia disponible
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Chofer</p>
            <p className="text-muted-foreground">{alarm.driver.name}</p>
          </div>
          <div>
            <p className="font-medium">Vehículo</p>
            <p className="text-muted-foreground">{alarm.vehicle.licensePlate}</p>
          </div>
          <div>
            <p className="font-medium">Fecha y Hora</p>
            <p className="text-muted-foreground">{formatDate(alarm.timestamp)}</p>
          </div>
          <div>
            <p className="font-medium">Ubicación</p>
            <p className="text-muted-foreground truncate" title={alarm.location.address || 'No disponible'}>
              {alarm.location.address || 'No disponible'}
            </p>
          </div>
        </div>

        <div>
          <Textarea
            placeholder="Añadir un comentario (opcional)..."
            className="resize-none"
            rows={3}
            value={comment}
            onChange={handleCommentChange}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Action buttons section - mt-auto pushes it to the bottom if the parent div is flex-col and has space */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-auto pt-4 border-t"> 
        <Button 
          variant="destructive"
          onClick={handleReject}
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[120px]" // Adjusted width
        >
          <X className="h-4 w-4 mr-2" />
          Descartar
        </Button>
        <Button 
          variant="outline"
          onClick={handleSkip}
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[120px]" // Adjusted width
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Omitir
        </Button>
        <Button 
          variant="success"
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[120px]" // Adjusted width
        >
          <Check className="h-4 w-4 mr-2" />
          Confirmar
        </Button>
      </div>
    </div>
  );
}