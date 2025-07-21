// frontend/components/alarms/anomaly-selector.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAnomalias } from '@/lib/api';
import { Anomaly } from '@/types';

interface AnomalySelectorProps {
  selectedAnomalyId?: number | null;
  onSelectAnomaly: (anomalyId: number) => void; // Cambiado para no aceptar null
  disabled?: boolean;
}

export function AnomalySelector({ selectedAnomalyId, onSelectAnomaly, disabled }: AnomalySelectorProps) {
  const [open, setOpen] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadAnomalies = async () => {
      setIsLoading(true);
      try {
        const anomaliasData = await getAnomalias();
        setAnomalies(anomaliasData);
      } catch (error) {
        console.error("Error al cargar las anomalías", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnomalies();
  }, []);

  const selectedAnomaly = anomalies.find(anomaly => anomaly.idAnomalia === selectedAnomalyId);

  const handleSelect = (anomalyId: number) => { // Removido el | null
    onSelectAnomaly(anomalyId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="h-4 w-4" />
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando anomalías...</span>
              </>
            ) : (
              selectedAnomaly ? selectedAnomaly.nomAnomalia || "Sin nombre" : "Seleccionar anomalía..."
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar anomalía..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "Cargando..." : "No se encontró ninguna anomalía."}</CommandEmpty>
            <CommandGroup>
              {anomalies.map((anomaly) => (
                <CommandItem
                  key={anomaly.idAnomalia}
                  value={`${anomaly.idAnomalia}-${anomaly.nomAnomalia}`} // Cambiamos el value para hacerlo único
                  onSelect={() => handleSelect(anomaly.idAnomalia)}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedAnomalyId === anomaly.idAnomalia ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className="font-medium">{anomaly.nomAnomalia || "Sin nombre"}</span>
                    {/*anomaly.descAnomalia && (
                      <span className="text-xs text-muted-foreground">{anomaly.descAnomalia}</span>
                    )*/}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}