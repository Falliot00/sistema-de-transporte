// frontend/components/alarms/advanced-filters.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface AdvancedFiltersProps {
  availableTypes: string[];
  selectedTypes: string[];
  onTypeSelectionChange: (newSelection: string[]) => void;
  // --- INICIO DE LA SOLUCIÓN: Nuevas props para el filtro de empresa ---
  availableCompanies: string[];
  selectedCompanies: string[];
  onCompanySelectionChange: (newSelection: string[]) => void;
  // --- FIN DE LA SOLUCIÓN ---
}

export function AdvancedFilters({
  availableTypes,
  selectedTypes,
  onTypeSelectionChange,
  availableCompanies,
  selectedCompanies,
  onCompanySelectionChange,
}: AdvancedFiltersProps) {
  
  const handleTypeChange = (type: string) => {
    const newSelection = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onTypeSelectionChange(newSelection);
  };

  // --- INICIO DE LA SOLUCIÓN: Manejador para el filtro de empresa ---
  const handleCompanyChange = (company: string) => {
    const newSelection = selectedCompanies.includes(company)
      ? selectedCompanies.filter((c) => c !== company)
      : [...selectedCompanies, company];
    onCompanySelectionChange(newSelection);
  };
  
  const clearFilters = () => {
    onTypeSelectionChange([]);
    onCompanySelectionChange([]);
  };

  const totalFilters = selectedTypes.length + selectedCompanies.length;
  // --- FIN DE LA SOLUCIÓN ---

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-[120px] justify-between">
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
                <Button variant="ghost" size="sm" onClick={clearFilters} disabled={totalFilters === 0}>
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                </Button>
            </div>
        </div>

        <Separator />

        {/* Sección de Filtro por Tipo */}
        <div className="p-4">
            <h5 className="font-semibold text-sm mb-2">Por Tipo de Alarma</h5>
            <div className="grid gap-2 max-h-40 overflow-y-auto pr-2">
                {availableTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                        <Checkbox id={`type-${type}`} checked={selectedTypes.includes(type)} onCheckedChange={() => handleTypeChange(type)} />
                        <Label htmlFor={`type-${type}`} className="font-normal cursor-pointer flex-grow">{type}</Label>
                    </div>
                ))}
            </div>
        </div>
        
        <Separator />

        {/* --- INICIO DE LA SOLUCIÓN: Nueva sección para filtro de empresa --- */}
        <div className="p-4">
            <h5 className="font-semibold text-sm mb-2">Por Empresa</h5>
            <div className="grid gap-2">
                {availableCompanies.map((company) => (
                    <div key={company} className="flex items-center space-x-2">
                        <Checkbox id={`company-${company}`} checked={selectedCompanies.includes(company)} onCheckedChange={() => handleCompanyChange(company)} />
                        <Label htmlFor={`company-${company}`} className="font-normal cursor-pointer flex-grow">{company}</Label>
                    </div>
                ))}
            </div>
        </div>
        {/* --- FIN DE LA SOLUCIÓN --- */}
      </PopoverContent>
    </Popover>
  );
}