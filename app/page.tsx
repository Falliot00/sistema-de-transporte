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
  mockKPIs, 
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
    setFilteredAlarms(alarmsForTab);
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
      setSelectedAlarm(pendingAlarms[0]);
      setIsReviewMode(true);
    }
  };

  const handleConfirmAlarm = (alarm: Alarm, comment: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const updatedAlarm = {
        ...alarm,
        status: 'confirmed' as AlarmStatus,
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

      setAlarms(prev => prev.map(a => a.id === alarm.id ? updatedAlarm : a));
      
      const nextPendingAlarm = pendingAlarms.find(a => a.id !== alarm.id);
      if (nextPendingAlarm && isReviewMode) {
        setSelectedAlarm(nextPendingAlarm);
      } else {
        setIsReviewMode(false);
        setSelectedAlarm(null);
      }
      
      setIsLoading(false);
      toast({
        title: "Alarma confirmada",
        description: `La alarma ${alarm.id} ha sido confirmada exitosamente.`,
      });
    }, 1000);
  };

  const handleRejectAlarm = (alarm: Alarm, comment: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const updatedAlarm = {
        ...alarm,
        status: 'rejected' as AlarmStatus,
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

      setAlarms(prev => prev.map(a => a.id === alarm.id ? updatedAlarm : a));
      
      const nextPendingAlarm = pendingAlarms.find(a => a.id !== alarm.id);
      if (nextPendingAlarm && isReviewMode) {
        setSelectedAlarm(nextPendingAlarm);
      } else {
        setIsReviewMode(false);
        setSelectedAlarm(null);
      }
      
      setIsLoading(false);
      toast({
        title: "Alarma descartada",
        description: `La alarma ${alarm.id} ha sido descartada exitosamente.`,
      });
    }, 1000);
  };

  const handleSkipAlarm = (alarm: Alarm) => {
    const nextPendingAlarm = pendingAlarms.find(a => a.id !== alarm.id);
    if (nextPendingAlarm && isReviewMode) {
      setSelectedAlarm(nextPendingAlarm);
      
      // Move the skipped alarm to the end of the pending alarms
      setAlarms(prev => {
        const withoutCurrent = prev.filter(a => a.id !== alarm.id);
        return [...withoutCurrent, alarm];
      });
      
      toast({
        title: "Alarma omitida",
        description: `La alarma ${alarm.id} ha sido movida al final de la cola.`,
      });
    } else {
      setIsReviewMode(false);
      setSelectedAlarm(null);
    }
  };

  useEffect(() => {
    const alarmsForTab = alarms.filter(alarm => {
      if (activeTab === 'all') return true;
      return alarm.status === activeTab;
    });
    setFilteredAlarms(alarmsForTab);
  }, [alarms, activeTab]);

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
          {mockKPIs.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>

        {pendingAlarms.length > 0 ? (
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleStartReview}
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              Analizar Alarmas Pendientes
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay alarmas pendientes por analizar.</p>
          </div>
        )}
        
        <FilterPanel onFilterChange={handleFilterChange} />
        
        <AlarmTabs counts={counts} onTabChange={handleTabChange} />
        
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedAlarm && (
            isReviewMode ? (
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
                totalPending={pendingAlarms.length}
                currentIndex={pendingAlarms.findIndex(a => a.id === selectedAlarm.id) + 1}
              />
            ) : (
              <AlarmDetails
                alarm={selectedAlarm}
                onConfirm={handleConfirmAlarm}
                onReject={handleRejectAlarm}
                onClose={handleCloseModal}
                isLoading={isLoading}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}