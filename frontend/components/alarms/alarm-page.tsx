// frontend/components/alarms/alarms-page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { Alarm } from "@/types";
import { getAlarms, reviewAlarm as apiReviewAlarm } from "@/lib/api";

import { FilterPanel } from "./filter-panel";
import { AlarmCard } from "./alarm-card";
import { AlarmDetails } from "./alarm-details";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function AlarmsPage() {
  const { toast } = useToast();
  
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
        const firstPending = data.find(a => a.status === 'pending') || data[0] || null;
        setSelectedAlarm(firstPending);
      } catch (e) {
        setError("Error de conexión: No se pudieron cargar las alarmas desde el servidor.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- FILTERING LOGIC ---
  const filteredAlarms = useMemo(() => {
    if (statusFilter === "all") return masterAlarms;
    return masterAlarms.filter((alarm) => alarm.status === statusFilter);
  }, [masterAlarms, statusFilter]);

  // --- EVENT HANDLERS ---
  const handleAlarmUpdate = (updatedAlarm: Alarm) => {
    setMasterAlarms(currentAlarms =>
      currentAlarms.map(a => (a.id === updatedAlarm.id ? updatedAlarm : a))
    );
    if (selectedAlarm?.id === updatedAlarm.id) {
      setSelectedAlarm(updatedAlarm);
    }
    toast({
      title: "Alarma Actualizada",
      description: `La alarma para el vehículo ${updatedAlarm.vehicle.licensePlate} ha sido actualizada.`,
    });
  };

  // --- RENDER LOGIC ---
  return (
    <div className="space-y-4">
        <div>
            <h1 className="text-3xl font-bold">Gestión de Alarmas</h1>
            <p className="text-muted-foreground">
                Revise, confirme o rechace las alarmas generadas por los dispositivos.
            </p>
        </div>

        <FilterPanel statusFilter={statusFilter} onStatusChange={setStatusFilter} />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            <div className="md:col-span-1 lg:col-span-1 h-full overflow-y-auto pr-2 space-y-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </>
                ) : error ? (
                    <div className="p-4 text-center text-destructive">{error}</div>
                ) : filteredAlarms.length > 0 ? (
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
            
            <div className="md:col-span-2 lg:col-span-3 h-full">
                <AlarmDetails alarm={selectedAlarm} onAlarmUpdate={handleAlarmUpdate} />
            </div>
        </div>
    </div>
  );
}