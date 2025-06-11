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
  // --- STATE MANAGEMENT ---
  const [masterAlarms, setMasterAlarms] = useState<Alarm[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAlarms();
        setMasterAlarms(data);
        // Selecciona la primera alarma pendiente, o la primera de la lista si no hay pendientes.
        const firstPending = data.find(a => a.status === 'pending') || data[0] || null;
        setSelectedAlarm(firstPending);
      } catch (e) {
        setError("No se pudieron cargar los datos desde el servidor.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredAlarms = useMemo(() => {
    if (statusFilter === "all") {
      return masterAlarms;
    }
    return masterAlarms.filter((alarm) => alarm.status === statusFilter);
  }, [masterAlarms, statusFilter]);

  // --- EVENT HANDLERS ---
  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleSelectAlarm = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
  };

  const handleAlarmUpdate = (updatedAlarm: Alarm) => {
    // Actualiza la lista maestra para que el cambio se refleje en todos lados.
    setMasterAlarms(currentAlarms =>
      currentAlarms.map(a => (a.id === updatedAlarm.id ? updatedAlarm : a))
    );
    // También actualiza la alarma seleccionada si es la misma.
    if (selectedAlarm?.id === updatedAlarm.id) {
      setSelectedAlarm(updatedAlarm);
    }
  };
  
  // --- RENDER LOGIC ---

  // Estado de Carga
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full p-4">
        <div className="md:col-span-1 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  // Estado de Error
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  // Contenido Principal
  return (
    <div className="flex flex-col gap-6 p-4 h-full">
      <FilterPanel statusFilter={statusFilter} onStatusChange={handleStatusChange} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow min-h-0">
        <div className="md:col-span-1 h-[calc(100vh-220px)] overflow-y-auto pr-2 space-y-4">
          {filteredAlarms.length > 0 ? (
            filteredAlarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                isSelected={selectedAlarm?.id === alarm.id}
                onSelect={() => handleSelectAlarm(alarm)}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground pt-10">
              No hay alarmas que coincidan con los filtros seleccionados.
            </div>
          )}
        </div>
        
        <div className="md:col-span-2 h-full">
          <AlarmDetails alarm={selectedAlarm} onAlarmUpdate={handleAlarmUpdate} />
        </div>
      </div>
    </div>
  );
}