// frontend/components/alarms/alarm-media.tsx
import { useState } from "react";
import { MediaItem } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Play, Loader2, VideoOff, RefreshCw } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
// --- INICIO DE LA SOLUCIÓN ---
import { retryVideo } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
// --- FIN DE LA SOLUCIÓN ---


// --- INICIO DE LA SOLUCIÓN: Componente Placeholder con lógica ---
const VideoProcessingPlaceholder = ({ alarmId }: { alarmId: string }) => {
    const { toast } = useToast();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            const response = await retryVideo(alarmId);
            toast({
                title: "Solicitud Enviada",
                description: response.message,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "No se pudo reintentar la descarga.",
                variant: "destructive",
            });
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground bg-background/50 rounded-md p-4">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="font-semibold">Procesando video...</p>
            <p className="text-xs mb-3">Esto puede tardar unos minutos.</p>
            <Button onClick={handleRetry} disabled={isRetrying} size="sm">
                {isRetrying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Reintentar
            </Button>
        </div>
    );
};
// --- FIN DE LA SOLUCIÓN ---


interface AlarmMediaProps {
  media: MediaItem[];
  videoProcessing?: boolean;
  alarmId: string; // ID de la alarma es ahora requerido
}


export function AlarmMedia({ media, videoProcessing = false, alarmId }: AlarmMediaProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const images = media.filter(item => item.type === 'image');
  const videos = media.filter(item => item.type === 'video');

  const activeMedia = media[activeIndex];

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % media.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + media.length) % media.length);

  const openDialogWithItem = (itemId: string) => {
    const index = media.findIndex(m => m.id === itemId);
    if (index !== -1) {
      setActiveIndex(index);
      setIsDialogOpen(true);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">Todos ({media.length})</TabsTrigger>
          <TabsTrigger value="images">Imágenes ({images.length})</TabsTrigger>
          <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
            {videoProcessing && videos.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <MediaGrid items={images} onItemClick={openDialogWithItem} />
                    {/* Usar el nuevo componente con lógica */}
                    <VideoProcessingPlaceholder alarmId={alarmId} />
                </div>
            ) : (
                <MediaGrid items={media} onItemClick={openDialogWithItem} />
            )}
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <MediaGrid items={images} onItemClick={openDialogWithItem} />
        </TabsContent>
        
        <TabsContent value="videos" className="mt-4">
            {videoProcessing && videos.length === 0 ? (
                <VideoProcessingPlaceholder alarmId={alarmId} />
            ) : videos.length > 0 ? (
                <MediaGrid items={videos} onItemClick={openDialogWithItem} />
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground bg-background/50 rounded-md">
                    <VideoOff className="h-8 w-8 mb-2"/>
                    <p>No hay videos para esta alarma.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <div className="relative">
            {activeMedia ? (
                activeMedia.type === 'image' ? (
                <div className="relative w-full h-[400px]">
                    <img src={activeMedia.url} alt="Media content" className="rounded-md object-contain w-full h-full" />
                </div>
                ) : (
                <div className="relative w-full h-[400px] bg-black rounded-md overflow-hidden">
                    <video src={activeMedia?.url} controls autoPlay className="w-full h-full" />
                </div>
                )
            ) : (
                <Skeleton className="h-[400px] w-full" />
            )}
            {media.length > 1 && (
                 <div className="absolute top-1/2 left-0 transform -translate-y-1/2 flex justify-between w-full px-2">
                    <Button variant="outline" size="icon" className="bg-background/80 rounded-full" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="bg-background/80 rounded-full" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            )}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {activeIndex + 1} de {media.length}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MediaGridProps {
  items: MediaItem[];
  onItemClick: (id: string) => void;
}

function MediaGrid({ items, onItemClick }: MediaGridProps) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
          onClick={() => onItemClick(item.id)}
        >
          {/* Se usa el thumbnail si está disponible, sino la url principal */}
          <img
            src={item.thumbnailUrl || item.url}
            alt={`Media ${item.id}`}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
          />
          {item.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Play className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}