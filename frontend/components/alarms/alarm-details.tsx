"use client";

import { useState } from "react";
import { Alarm } from "@/types";
import { formatDate, getStatusColor, getStatusText, getTypeColor, getTypeText } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlarmMedia } from "./alarm-media";
import { DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar, 
  Camera, 
  Car, 
  Check, 
  MapPin, 
  Smartphone, 
  User, 
  X 
} from "lucide-react";

interface AlarmDetailsProps {
  alarm: Alarm;
  onConfirm: (alarm: Alarm, comment: string) => void;
  onReject: (alarm: Alarm, comment: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function AlarmDetails({ 
  alarm, 
  onConfirm, 
  onReject, 
  onClose,
  isLoading = false 
}: AlarmDetailsProps) {
  const [activeTab, setActiveTab] = useState("info");
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

  const isEditable = alarm.status === 'pending';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <DialogTitle asChild>
            <h2 className="text-xl font-bold">{alarm.id}</h2>
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getStatusColor(alarm.status)}>
              {getStatusText(alarm.status)}
            </Badge>
            <Badge className={getTypeColor(alarm.type)}>
              {getTypeText(alarm.type)}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="media">Multimedia</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Información del Chofer</h3>
              <div className="flex items-start gap-2">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{alarm.driver.name}</p>
                  <p className="text-sm text-muted-foreground">Licencia: {alarm.driver.license}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Información del Vehículo</h3>
              <div className="flex items-start gap-2">
                <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{alarm.vehicle.licensePlate}</p>
                  <p className="text-sm text-muted-foreground">Modelo: {alarm.vehicle.model}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Dispositivo</h3>
              <div className="flex items-start gap-2">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{alarm.device.name}</p>
                  <p className="text-sm text-muted-foreground">SN: {alarm.device.serialNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Multimedia</h3>
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{alarm.media.length} archivos</p>
                  <p className="text-sm text-muted-foreground">
                    {alarm.media.filter(m => m.type === 'image').length} imágenes, 
                    {alarm.media.filter(m => m.type === 'video').length} videos
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Ubicación</h3>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{alarm.location.address || 'No disponible'}</p>
                  <p className="text-sm text-muted-foreground">
                    Lat: {alarm.location.latitude.toFixed(6)}, Lon: {alarm.location.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Fecha y Hora</h3>
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="font-medium">{formatDate(alarm.timestamp)}</p>
              </div>
            </div>
          </div>

          {alarm.reviewer && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Revisión</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{alarm.reviewer.name}</p>
                    <p className="text-sm text-muted-foreground">{alarm.reviewer.email}</p>
                  </div>
                </div>
                {alarm.reviewedAt && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p className="font-medium">{formatDate(alarm.reviewedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Comentarios</h3>
            
            {alarm.comments.length > 0 ? (
              <div className="space-y-3">
                {alarm.comments.map(comment => (
                  <div key={comment.id} className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium text-sm">{comment.author.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</p>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay comentarios.</p>
            )}

            {isEditable && (
              <div className="mt-4">
                <Textarea
                  placeholder="Añadir un comentario..."
                  className="resize-none"
                  rows={3}
                  value={comment}
                  onChange={handleCommentChange}
                />
              </div>
            )}
          </div>
          
          {isEditable && (
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={handleReject}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Descartar Alarma
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Alarma
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="media" className="mt-4">
          <AlarmMedia media={alarm.media} />
        </TabsContent>
      </Tabs>
    </div>
  );
}