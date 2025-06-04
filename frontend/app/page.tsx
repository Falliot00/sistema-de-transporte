// app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { KPICard } from "@/components/alarms/kpi-card";
import { AlarmCard } from "@/components/alarms/alarm-card";
import { AlarmTabs } from "@/components/alarms/alarm-tabs";
import { FilterPanel } from "@/components/alarms/filter-panel";
import { AlarmDetails } from "@/components/alarms/alarm-details";
import { AlarmReview } from "@/components/alarms/alarm-review";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { 
  mockPageKPIs, // Changed from mockKPIs to mockPageKPIs
  generateInitialMockAlarms,
  getAlarmsByStatus, 
  getAlarmCounts, 
  filterAlarms 
} from "@/lib/mock-data";
import { Alarm, AlarmFilterParams, AlarmStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [filteredAlarms, setFilteredAlarms] = useState<Alarm[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<AlarmStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initialAlarms = generateInitialMockAlarms();
    setAlarms(initialAlarms);
    setFilteredAlarms(initialAlarms);
  }, []);

  const counts = getAlarmCounts(alarms);
  const pendingAlarms = alarms.filter(alarm => alarm.status === 'pending');

  const handleFilterChange = useCallback((filters: AlarmFilterParams) => {
    const alarmsForTab = getAlarmsByStatus(alarms, activeTab);
    const filtered = filterAlarms(alarmsForTab, filters);
    setFilteredAlarms(filtered);
  }, [activeTab, alarms]);

  const handleTabChange = useCallback((tab: AlarmStatus | 'all') => {
    setActiveTab(tab);
    const alarmsForTab = getAlarmsByStatus(alarms, tab);
    setFilteredAlarms(alarmsForTab); // Apply tab filter first
    // Then, if there are active text/type/status filters, re-apply them
    // This requires storing the current filters from FilterPanel if they are not passed down again
  }, [alarms]);

  const handleAlarmClick = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlarm(null);
  };

  const handleStartReview = () => {
    if (pendingAlarms.length > 0) {
      // Sort pending alarms to ensure a consistent order if needed, e.g., by timestamp
      const sortedPending = [...pendingAlarms].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setSelectedAlarm(sortedPending[0]);
      setIsReviewMode(true);
    }
  };

  const updateAlarmState = (updatedAlarm: Alarm, successMessage: string) => {
    setAlarms(prevAlarms => prevAlarms.map(a => a.id === updatedAlarm.id ? updatedAlarm : a));
    
    // Update filtered alarms based on the new alarms state and current active tab
    // The getAlarmsByStatus will correctly reflect the change
    setFilteredAlarms(prevFiltered => {
        const updatedInFiltered = prevFiltered.map(a => a.id === updatedAlarm.id ? updatedAlarm : a);
        if (activeTab === 'all' || activeTab === updatedAlarm.status) {
            return updatedInFiltered.filter(a => activeTab === 'all' || a.status === activeTab);
        }
        return updatedInFiltered.filter(a => a.id !== updatedAlarm.id); // Remove if status changed and not matching tab
    });


    const currentPendingAlarms = alarms.filter(a => a.status === 'pending' && a.id !== updatedAlarm.id)
                                     .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (isReviewMode) {
      if (currentPendingAlarms.length > 0) {
        setSelectedAlarm(currentPendingAlarms[0]);
      } else {
        setIsReviewMode(false);
        setSelectedAlarm(null);
        toast({ title: "Revisión Completada", description: "Todas las alarmas pendientes han sido procesadas." });
      }
    } else {
      // If not in review mode, but the selected alarm was updated (e.g. from details view)
      if (selectedAlarm && selectedAlarm.id === updatedAlarm.id) {
        setSelectedAlarm(updatedAlarm); // Keep modal open with updated details
      }
    }
    
    setIsLoading(false);
    toast({
      title: successMessage,
      description: `La alarma ${updatedAlarm.id} ha sido actualizada.`,
    });
  };


  const handleConfirmAlarm = (alarm: Alarm, comment: string) => {
    setIsLoading(true);
    
    setTimeout(() => { // Simulate API call
      const updatedAlarm: Alarm = {
        ...alarm,
        status: 'confirmed',
        reviewer: {
          id: 'admin-user',
          name: 'Admin Usuario',
          email: 'admin@example.com'
        },
        reviewedAt: new Date().toISOString(),
        comments: comment ? [
          ...alarm.comments,
          {
            id: Math.random().toString(36).substring(2, 10),
            text: comment,
            author: {
              id: 'admin-user',
              name: 'Admin Usuario'
            },
            timestamp: new Date().toISOString()
          }
        ] : alarm.comments
      };
      updateAlarmState(updatedAlarm, "Alarma Confirmada");
    }, 1000);
  };

  const handleRejectAlarm = (alarm: Alarm, comment: string) => {
    setIsLoading(true);
    
    setTimeout(() => { // Simulate API call
      const updatedAlarm: Alarm = {
        ...alarm,
        status: 'rejected',
        reviewer: {
          id: 'admin-user',
          name: 'Admin Usuario',
          email: 'admin@example.com'
        },
        reviewedAt: new Date().toISOString(),
        comments: comment ? [
          ...alarm.comments,
          {
            id: Math.random().toString(36).substring(2, 10),
            text: comment,
            author: {
              id: 'admin-user',
              name: 'Admin Usuario'
            },
            timestamp: new Date().toISOString()
          }
        ] : alarm.comments
      };
      updateAlarmState(updatedAlarm, "Alarma Descartada");
    }, 1000);
  };

  const handleSkipAlarm = (alarmToSkip: Alarm) => {
    // Find the next pending alarm excluding the current one
    const remainingPending = alarms.filter(a => a.status === 'pending' && a.id !== alarmToSkip.id)
                                .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
    if (isReviewMode) {
      if (remainingPending.length > 0) {
        setSelectedAlarm(remainingPending[0]);
        // Move the skipped alarm to the end of the original alarms array to affect its order in future pending lists
        setAlarms(prev => {
          const withoutSkipped = prev.filter(a => a.id !== alarmToSkip.id);
          return [...withoutSkipped, alarmToSkip]; 
        });
        toast({
          title: "Alarma Omitida",
          description: `La alarma ${alarmToSkip.id} se revisará más tarde.`,
        });
      } else {
        // No other pending alarms left besides the one being skipped
        setIsReviewMode(false);
        setSelectedAlarm(null);
        toast({ 
          title: "Revisión Pausada", 
          description: `La alarma ${alarmToSkip.id} es la última pendiente. Se revisará más tarde.` 
        });
      }
    }
  };
  
  // This useEffect ensures that when 'alarms' state changes (e.g., after an update),
  // the 'filteredAlarms' and 'pendingAlarms' for review mode are correctly refreshed.
  useEffect(() => {
    const newCounts = getAlarmCounts(alarms);
    // Update KPIs that depend on counts if they are part of this page's state
    // (mockPageKPIs are static for now, but could be dynamic)

    // Re-filter alarms for the current tab
    handleFilterChange({}); // Call with empty filters to re-apply tab filtering

    // Update pending alarms for review mode
    const currentPendingAlarms = alarms.filter(a => a.status === 'pending')
                                     .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (isReviewMode) {
      if (selectedAlarm && !currentPendingAlarms.find(a => a.id === selectedAlarm.id)) {
        // If the currently selected alarm for review is no longer pending or doesn't exist
        if (currentPendingAlarms.length > 0) {
          setSelectedAlarm(currentPendingAlarms[0]);
        } else {
          setIsReviewMode(false);
          setSelectedAlarm(null);
        }
      } else if (!selectedAlarm && currentPendingAlarms.length > 0) {
        // If review mode is on but no alarm is selected (e.g., initial load into review)
         setSelectedAlarm(currentPendingAlarms[0]);
      } else if (currentPendingAlarms.length === 0) {
        setIsReviewMode(false);
        setSelectedAlarm(null);
      }
    }
  }, [alarms, activeTab, isReviewMode, selectedAlarm, handleFilterChange]);


  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Alarmas</h1>
          <p className="text-muted-foreground">
            Gestión y monitoreo de alarmas del sistema de transporte
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Use mockPageKPIs which is correctly imported now */}
          {mockPageKPIs.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>

        {pendingAlarms.length > 0 && !isReviewMode ? ( // Show button only if not already in review mode
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleStartReview}
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              Analizar {pendingAlarms.length} Alarmas Pendientes 
            </Button>
          </div>
        ) : !isReviewMode && pendingAlarms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay alarmas pendientes por analizar.</p>
          </div>
        ) : null}
        
        <FilterPanel onFilterChange={handleFilterChange} />
        
        <AlarmTabs counts={getAlarmCounts(alarms)} onTabChange={handleTabChange} /> {/* Pass updated counts */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlarms.length > 0 ? (
            filteredAlarms.map((alarm) => (
              <AlarmCard key={alarm.id} alarm={alarm} onClick={handleAlarmClick} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No se encontraron alarmas con los filtros actuales.</p>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={isModalOpen || isReviewMode} onOpenChange={(open) => {
        if (!open) {
          setIsModalOpen(false);
          setIsReviewMode(false);
          setSelectedAlarm(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] min-h-[75vh] flex flex-col overflow-y-auto p-0"> {/* Adjusted for better modal sizing */}
          {selectedAlarm && (
            isReviewMode ? (
              <div className="p-6 flex-grow">
                <AlarmReview
                  alarm={selectedAlarm}
                  onConfirm={handleConfirmAlarm}
                  onReject={handleRejectAlarm}
                  onSkip={handleSkipAlarm}
                  onClose={() => {
                    setIsReviewMode(false);
                    setSelectedAlarm(null);
                  }}
                  isLoading={isLoading}
                  totalPending={alarms.filter(a => a.status === 'pending').length}
                  currentIndex={alarms.filter(a => a.status === 'pending').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).findIndex(a => a.id === selectedAlarm.id) + 1}
                />
              </div>
            ) : (
              <div className="p-6 flex-grow">
                <AlarmDetails
                  alarm={selectedAlarm}
                  onConfirm={handleConfirmAlarm}
                  onReject={handleRejectAlarm}
                  onClose={handleCloseModal}
                  isLoading={isLoading}
                />
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}