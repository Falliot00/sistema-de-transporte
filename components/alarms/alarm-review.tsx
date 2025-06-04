"use client";

import { useState } from "react";
import { Alarm } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogTitle } from "@/components/ui/dialog";
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

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleConfirm = () => {
    onConfirm(alarm, comment);
  };

  const handleReject = () => {
    onReject(alarm, comment);
  };

  const handleSkip = () => {
    onSkip(alarm);
  };

  const mainMedia = alarm.media[0];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <DialogTitle asChild>
            <h2 className="text-xl font-bold">{alarm.id}</h2>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Analizando alarma {currentIndex} de {totalPending}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {mainMedia?.type === 'video' ? (
            <video
              src={mainMedia.url}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={mainMedia?.url}
              alt="Evidencia de alarma"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
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
            <p className="text-muted-foreground">{alarm.location.address || 'No disponible'}</p>
          </div>
        </div>

        <div>
          <Textarea
            placeholder="Añadir un comentario (opcional)..."
            className="resize-none"
            rows={3}
            value={comment}
            onChange={handleCommentChange}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleReject}
            disabled={isLoading}
            className="w-32"
          >
            <X className="h-4 w-4 mr-2" />
            Descartar
          </Button>
          <Button 
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
            className="w-32"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Omitir
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-32"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}