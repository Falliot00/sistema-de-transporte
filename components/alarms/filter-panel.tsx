"use client";

import { useState } from "react";
import { AlarmFilterParams, AlarmStatus, AlarmType } from "@/types";
import { getStatusText, getTypeText } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter, X } from "lucide-react";

interface FilterPanelProps {
  onFilterChange: (filters: AlarmFilterParams) => void;
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<AlarmStatus[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<AlarmType[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    applyFilters(e.target.value, selectedStatuses, selectedTypes);
  };

  const handleStatusChange = (status: AlarmStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    
    setSelectedStatuses(newStatuses);
    applyFilters(search, newStatuses, selectedTypes);
  };

  const handleTypeChange = (type: AlarmType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    applyFilters(search, selectedStatuses, newTypes);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedStatuses([]);
    setSelectedTypes([]);
    applyFilters("", [], []);
    setIsFiltersOpen(false);
  };

  const applyFilters = (
    searchText: string,
    statuses: AlarmStatus[],
    types: AlarmType[]
  ) => {
    onFilterChange({
      search: searchText,
      status: statuses.length > 0 ? statuses : undefined,
      type: types.length > 0 ? types : undefined,
    });
  };

  const statuses: AlarmStatus[] = ["pending", "confirmed", "rejected"];
  const types: AlarmType[] = ["phone", "seatbelt", "speed", "fatigue", "distraction"];

  const hasActiveFilters = selectedStatuses.length > 0 || selectedTypes.length > 0;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por chofer, patente o ID..."
            className="pl-8"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 text-xs flex items-center justify-center text-primary-foreground">
                    {selectedStatuses.length + selectedTypes.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Estado</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {statuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => handleStatusChange(status)}
                        />
                        <Label htmlFor={`status-${status}`} className="cursor-pointer">
                          {getStatusText(status)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tipo</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {types.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => handleTypeChange(type)}
                        />
                        <Label htmlFor={`type-${type}`} className="cursor-pointer">
                          {getTypeText(type)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" /> Limpiar filtros
                  </Button>
                  <Button size="sm" onClick={() => setIsFiltersOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}