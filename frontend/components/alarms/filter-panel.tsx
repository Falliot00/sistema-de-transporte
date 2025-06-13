import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ALARM_STATUS_ES_PLURAL } from "@/lib/utils";

type FilterPanelProps = {
  statusFilter: string;
  onStatusChange: (status: string) => void;
};

export function FilterPanel({ statusFilter, onStatusChange }: FilterPanelProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border-b">
      <h2 className="text-lg font-semibold">Filtros</h2>
      <ToggleGroup
        type="single"
        variant="outline"
        value={statusFilter}
        onValueChange={(value) => {
          if (value) onStatusChange(value);
        }}
        aria-label="Filtrar alarmas por estado"
      >
        <ToggleGroupItem value="all" aria-label="Mostrar todos">Todos</ToggleGroupItem>
        <ToggleGroupItem value="pending" aria-label="Mostrar pendientes">{ALARM_STATUS_ES_PLURAL.pending}</ToggleGroupItem>
        <ToggleGroupItem value="confirmed" aria-label="Mostrar sospechosas">{ALARM_STATUS_ES_PLURAL.confirmed}</ToggleGroupItem>
        <ToggleGroupItem value="rejected" aria-label="Mostrar rechazados">{ALARM_STATUS_ES_PLURAL.rejected}</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}