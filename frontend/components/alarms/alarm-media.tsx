import { useState } from "react";
import Image from "next/image";
import { MediaItem } from "@/types";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

interface AlarmMediaProps {
  media: MediaItem[];
}

export function AlarmMedia({ media }: AlarmMediaProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const images = media.filter(item => item.type === 'image');
  const videos = media.filter(item => item.type === 'video');

  const activeMedia = media[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % media.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all">
            Todos ({media.length})
          </TabsTrigger>
          <TabsTrigger value="images">
            Imágenes ({images.length})
          </TabsTrigger>
          <TabsTrigger value="videos">
            Videos ({videos.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <MediaGrid 
            items={media} 
            onItemClick={(index) => {
              setActiveIndex(index);
              setIsDialogOpen(true);
            }} 
          />
        </TabsContent>
        <TabsContent value="images" className="mt-4">
          <MediaGrid 
            items={images} 
            onItemClick={(index) => {
              setActiveIndex(media.findIndex(m => m.id === images[index].id));
              setIsDialogOpen(true);
            }} 
          />
        </TabsContent>
        <TabsContent value="videos" className="mt-4">
          <MediaGrid 
            items={videos} 
            onItemClick={(index) => {
              setActiveIndex(media.findIndex(m => m.id === videos[index].id));
              setIsDialogOpen(true);
            }} 
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <div className="relative">
            {activeMedia?.type === 'image' ? (
              <div className="relative w-full h-[400px]">
                <img
                  src={activeMedia.url}
                  alt="Media content"
                  className="rounded-md object-contain w-full h-full"
                />
              </div>
            ) : (
              <div className="relative w-full h-[400px] bg-black rounded-md overflow-hidden">
                <video
                  src={activeMedia?.url}
                  controls
                  className="w-full h-full"
                />
              </div>
            )}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 flex justify-between w-full px-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-background/80 rounded-full"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-background/80 rounded-full"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
  onItemClick: (index: number) => void;
}

function MediaGrid({ items, onItemClick }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="relative aspect-square rounded-md overflow-hidden cursor-pointer"
          onClick={() => onItemClick(index)}
        >
          <img
            src={item.thumbnailUrl || item.url}
            alt={`Media ${index + 1}`}
            className="object-cover w-full h-full"
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