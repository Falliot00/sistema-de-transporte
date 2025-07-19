// frontend/components/shared/advanced-filters.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface FilterSectionProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onSelectionChange: (newSelection: string[]) => void;
}

interface AdvancedFiltersProps {
  filterSections: FilterSectionProps[];
  dateRange?: DateRange;
  onDateChange?: (date?: DateRange) => void;
  // --- NUEVA PROP: Función para manejar el clic en "Limpiar" ---
  onClear: () => void;
  disabled?: boolean;
}

export function AdvancedFilters({ filterSections, dateRange, onDateChange, onClear, disabled = false }: AdvancedFiltersProps) {
  
  const handleItemChange = (sectionIndex: number, item: string) => {
    const section = filterSections[sectionIndex];
    const newSelection = section.selectedItems.includes(item)
      ? section.selectedItems.filter((i) => i !== item)
      : [...section.selectedItems, item];
    section.onSelectionChange(newSelection);
  };
  
  // La función `clearAllFilters` ahora es manejada por el componente padre a través de `onClear`.
  
  const totalFilters = filterSections.reduce((acc, section) => acc + section.selectedItems.length, 0);
  // El rango de fechas ya no se cuenta como un "filtro" en el badge,
  // ya que siempre hay uno seleccionado. Esto es una mejora de UX.

  return (
    <div className="flex gap-2">
      {onDateChange && (
        <DateRangePicker date={dateRange} onDateChange={onDateChange} disabled={disabled} />
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 w-[120px] justify-between" disabled={disabled}>
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <span>Filtros</span>
            </div>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition-opacity duration-200",
                totalFilters > 0 ? "opacity-100" : "opacity-0"
              )}
            >
              {totalFilters}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <div className="p-4 grid gap-4">
              <div className="flex justify-between items-center">
                  <h4 className="font-medium leading-none">Filtros Avanzados</h4>
                  {/* --- CAMBIO: El botón ahora llama a `onClear` --- */}
                  <Button variant="ghost" size="sm" onClick={onClear} disabled={totalFilters === 0}>
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                  </Button>
              </div>
          </div>

          <Separator />
          
          {filterSections.map((section, sectionIndex) => (
            <div key={section.title}>
              <div className="p-4">
                  <h5 className="font-semibold text-sm mb-2">{section.title}</h5>
                  <div className="grid gap-2 max-h-40 overflow-y-auto pr-2">
                      {section.items.map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`filter-${sectionIndex}-${item}`} 
                                checked={section.selectedItems.includes(item)} 
                                onCheckedChange={() => handleItemChange(sectionIndex, item)} 
                              />
                              <Label htmlFor={`filter-${sectionIndex}-${item}`} className="font-normal cursor-pointer flex-grow">{item}</Label>
                          </div>
                      ))}
                  </div>
              </div>
              {/* No es necesario un Separator después del último elemento */}
              {sectionIndex < filterSections.length - 1 && <Separator />}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}