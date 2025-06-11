// frontend/components/alarms/filter-panel.tsx

"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ListFilter } from "lucide-react";

// Definimos los tipos para las props para mayor claridad y seguridad.
interface FilterPanelProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export function FilterPanel({ statusFilter, onStatusChange }: FilterPanelProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-lg">
      <ListFilter className="h-5 w-5" />
      <h3 className="font-semibold text-md">Filtrar por Estado</h3>
      <ToggleGroup
        type="single"
        variant="outline"
        value={statusFilter}
        onValueChange={(value) => {
          if (value) onStatusChange(value);
        }}
        aria-label="Filtrar por estado"
      >
        <ToggleGroupItem value="all" aria-label="Mostrar todos">
          Todos
        </ToggleGroupItem>
        <ToggleGroupItem value="pending" aria-label="Mostrar pendientes">
          Pendientes
        </ToggleGroupItem>
        <ToggleGroupItem value="confirmed" aria-label="Mostrar confirmados">
          Confirmados
        </ToggleGroupItem>
        <ToggleGroupItem value="rejected" aria-label="Mostrar rechazados">
          Rechazados
        </ToggleGroupItem>
      </ToggleGroup>
      {/* Aquí se podrían añadir más filtros, como un DateRangePicker */}
    </div>
  );
} 