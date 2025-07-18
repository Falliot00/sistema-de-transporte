// frontend/components/alarms/driver-selector.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Driver } from '@/types';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User, X, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDrivers } from '@/lib/api';

interface DriverSelectorProps {
  selectedDriverId?: number | null;
  onSelectDriver: (driverId: number | null) => void;
  alarmCompany?: string | null;
  disabled?: boolean;
}

export function DriverSelector({ selectedDriverId, onSelectDriver, alarmCompany, disabled }: DriverSelectorProps) {
  const [open, setOpen] = useState(false);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  
  useEffect(() => {
    const loadDrivers = async () => {
      setIsLoading(true);
      try {
        const driversData = await getDrivers();
        setAllDrivers(driversData);
      } catch (error) {
        console.error("Error al cargar los choferes", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDrivers();
  }, []);

  useEffect(() => {
    if(alarmCompany) {
        if (alarmCompany.toLowerCase().includes('monte')) setCompanyFilter('Monte Vera');
        else if (alarmCompany.toLowerCase().includes('laguna')) setCompanyFilter('Laguna Paiva');
    }
  }, [alarmCompany]);

  const filteredDrivers = useMemo(() => {
    if (companyFilter === 'all') return allDrivers;
    return allDrivers.filter(driver => driver.empresa?.includes(companyFilter));
  }, [allDrivers, companyFilter]);
  
  const selectedDriver = useMemo(() => {
    return allDrivers.find(driver => driver.choferes_id === selectedDriverId);
  }, [selectedDriverId, allDrivers]);

  const handleSelect = (driverId: number | null) => {
    onSelectDriver(driverId);
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
            <User className="h-4 w-4" />
            {/* --- CAMBIO: Usamos el campo unificado --- */}
            {selectedDriver ? selectedDriver.apellido_nombre : "Asignar un chofer..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar chofer por nombre o DNI..." />
          <div className="p-2 border-b flex gap-2">
              <Button size="sm" variant={companyFilter === 'all' ? 'default' : 'outline'} onClick={() => setCompanyFilter('all')}>Todos</Button>
              <Button size="sm" variant={companyFilter === 'Monte Vera' ? 'default' : 'outline'} onClick={() => setCompanyFilter('Monte Vera')}>Monte Vera</Button>
              <Button size="sm" variant={companyFilter === 'Laguna Paiva' ? 'default' : 'outline'} onClick={() => setCompanyFilter('Laguna Paiva')}>Laguna Paiva</Button>
          </div>
          <CommandList>
            <CommandEmpty>{isLoading ? "Cargando..." : "No se encontró ningún chofer."}</CommandEmpty>
            <CommandGroup>
                <CommandItem onSelect={() => handleSelect(null)} className="text-destructive">
                    <X className="mr-2 h-4 w-4" />
                    Quitar asignación
                </CommandItem>
              {filteredDrivers.map((driver) => (
                <CommandItem
                  key={driver.choferes_id}
                  // --- CAMBIO: Actualizamos el valor de búsqueda ---
                  value={`${driver.apellido_nombre} ${driver.dni}`}
                  onSelect={() => handleSelect(driver.choferes_id)}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedDriverId === driver.choferes_id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    {/* --- CAMBIO: Usamos el campo unificado --- */}
                    <span>{driver.apellido_nombre}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3"/>
                        {driver.empresa}
                    </span>
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