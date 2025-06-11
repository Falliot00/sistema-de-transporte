// frontend/components/alarms/alarm-tabs.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { Alarm } from "@/types";
import { getAlarms } from "@/lib/api";

import { FilterPanel } from "./filter-panel";
import { AlarmCard } from "./alarm-card";
import { AlarmDetails } from "./alarm-details";
import { Skeleton } from "@/components/ui/skeleton";

export function AlarmTabs() {
  const [masterAlarms, setMasterAlarms] = useState<Alarm[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de datos desde la API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAlarms();
        setMasterAlarms(data);
        const firstPending = data.find(a => a.status === 'pending') || data[0] || null;
        setSelectedAlarm(firstPending);
      } catch (e) {
        setError("Error de conexión: No se pudieron cargar las alarmas desde el servidor.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Lógica de filtrado que se recalcula solo cuando cambian las dependencias
  const filteredAlarms = useMemo(() => {
    if (statusFilter === "all") return masterAlarms;
    return masterAlarms.filter((alarm) => alarm.status === statusFilter);
  }, [masterAlarms, statusFilter]);

  // Manejador para actualizar el estado cuando se revisa una alarma
  const handleAlarmUpdate = (updatedAlarm: Alarm) => {
    setMasterAlarms(currentAlarms =>
      currentAlarms.map(a => (a.id === updatedAlarm.id ? updatedAlarm : a))
    );
    if (selectedAlarm?.id === updatedAlarm.id) {
      setSelectedAlarm(updatedAlarm);
    }
  };

  // Renderizado del estado de carga
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full p-4">
        <div className="md:col-span-1 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="md:col-span-2"><Skeleton className="h-full w-full" /></div>
      </div>
    );
  }

  // Renderizado del estado de error
  if (error) {
    return <div className="p-10 text-center text-destructive">{error}</div>;
  }

  // Renderizado principal
  return (
    <div className="flex flex-col gap-6 p-4 h-full">
      <FilterPanel statusFilter={statusFilter} onStatusChange={setStatusFilter} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow min-h-0">
        <div className="md:col-span-1 h-[calc(100vh-230px)] overflow-y-auto pr-2 space-y-4">
          {filteredAlarms.length > 0 ? (
            filteredAlarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                isSelected={selectedAlarm?.id === alarm.id}
                onSelect={() => setSelectedAlarm(alarm)}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground pt-10">No hay alarmas para el filtro seleccionado.</div>
          )}
        </div>
        
        <div className="md:col-span-2 h-full">
          <AlarmDetails alarm={selectedAlarm} onAlarmUpdate={handleAlarmUpdate} />
        </div>
      </div>
    </div>
  );
}