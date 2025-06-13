"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedFiltersProps {
  availableTypes: string[];
  selectedTypes: string[];
  onSelectionChange: (newSelection: string[]) => void;
}

export function AdvancedFilters({
  availableTypes,
  selectedTypes,
  onSelectionChange,
}: AdvancedFiltersProps) {
  
  const handleTypeChange = (type: string) => {
    const newSelection = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onSelectionChange(newSelection);
  };

  const clearFilters = () => {
    onSelectionChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* --- INICIO DE LA SOLUCIÓN --- */}
        {/* Usamos un layout flex con justify-between para mantener los elementos en su sitio */}
        <Button variant="outline" className="h-10 w-[120px] justify-between">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            <span>Filtros</span>
          </div>
          
          {/* El contador ahora usa opacidad en lugar de renderizado condicional */}
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-opacity duration-200",
              selectedTypes.length > 0 ? "opacity-100" : "opacity-0"
            )}
          >
            {selectedTypes.length}
          </span>
        </Button>
        {/* --- FIN DE LA SOLUCIÓN --- */}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h4 className="font-medium leading-none">Filtrar por Tipo</h4>
            </div>
            {/* --- INICIO DE LA SOLUCIÓN --- */}
            {/* El botón de limpiar también usa opacidad para evitar saltos de diseño */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={selectedTypes.length === 0}
              className={cn(
                "transition-opacity",
                selectedTypes.length > 0 ? "opacity-100" : "opacity-0"
              )}
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
            {/* --- FIN DE LA SOLUCIÓN --- */}
          </div>
          <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
            {availableTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => handleTypeChange(type)}
                />
                <Label
                  htmlFor={type}
                  className="font-normal cursor-pointer flex-grow"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}