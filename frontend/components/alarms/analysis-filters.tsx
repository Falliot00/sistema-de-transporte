// frontend/components/alarms/analysis-filters.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface AnalysisFiltersProps {
  availableTypes: string[];
  availableCompanies: string[];
  filters: {
    types: string[];
    companies: string[];
    dateRange?: DateRange;
  };
  onFilterChange: (newFilters: AnalysisFiltersProps['filters']) => void;
  isLoading: boolean;
}

export function AnalysisFilters({
  availableTypes,
  availableCompanies,
  filters,
  onFilterChange,
  isLoading
}: AnalysisFiltersProps) {

  const handleTypeChange = (type: string) => {
    const newSelection = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newSelection });
  };

  const handleCompanyChange = (company: string) => {
    const newSelection = filters.companies.includes(company)
      ? filters.companies.filter((c) => c !== company)
      : [...filters.companies, company];
    onFilterChange({ ...filters, companies: newSelection });
  };

  const handleDateChange = (dateRange?: DateRange) => {
    onFilterChange({ ...filters, dateRange });
  };

  const clearFilters = () => {
    onFilterChange({ types: [], companies: [], dateRange: undefined });
  };

  const totalFilters = filters.types.length + filters.companies.length + (filters.dateRange?.from ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-[120px] justify-between" disabled={isLoading}>
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
      <PopoverContent className="w-80 p-0">
        <div className="p-4 grid gap-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium leading-none">Filtrar Análisis</h4>
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={totalFilters === 0}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          </div>
        </div>

        <Separator />
        
        <div className="p-4 space-y-4">
            <div>
                <h5 className="font-semibold text-sm mb-2">Por Fecha</h5>
                <DateRangePicker date={filters.dateRange} onDateChange={handleDateChange} />
            </div>

            <div>
                <h5 className="font-semibold text-sm mb-2">Por Tipo de Alarma</h5>
                <div className="grid gap-2 max-h-40 overflow-y-auto pr-2">
                    {availableTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                            <Checkbox id={`analysis-type-${type}`} checked={filters.types.includes(type)} onCheckedChange={() => handleTypeChange(type)} />
                            <Label htmlFor={`analysis-type-${type}`} className="font-normal cursor-pointer flex-grow">{type}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h5 className="font-semibold text-sm mb-2">Por Empresa</h5>
                <div className="grid gap-2">
                    {availableCompanies.map((company) => (
                        <div key={company} className="flex items-center space-x-2">
                            <Checkbox id={`analysis-company-${company}`} checked={filters.companies.includes(company)} onCheckedChange={() => handleCompanyChange(company)} />
                            <Label htmlFor={`analysis-company-${company}`} className="font-normal cursor-pointer flex-grow">{company}</Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}