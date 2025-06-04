"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlarmStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AlarmTabsProps {
  counts: {
    all: number;
    pending: number;
    confirmed: number;
    rejected: number;
  };
  onTabChange: (value: AlarmStatus | 'all') => void;
}

export function AlarmTabs({ counts, onTabChange }: AlarmTabsProps) {
  const [activeTab, setActiveTab] = useState<AlarmStatus | 'all'>('all');

  const handleTabChange = (value: string) => {
    const tabValue = value as AlarmStatus | 'all';
    setActiveTab(tabValue);
    onTabChange(tabValue);
  };

  const getTabClass = (tab: AlarmStatus | 'all') => 
    cn(activeTab === tab ? "text-primary" : "text-muted-foreground");

  return (
    <Tabs defaultValue="all" onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full grid grid-cols-4 mb-4">
        <TabsTrigger value="all" className={getTabClass('all')}>
          Todas
          <Badge variant="secondary" className="ml-2">{counts.all}</Badge>
        </TabsTrigger>
        <TabsTrigger value="pending" className={getTabClass('pending')}>
          Pendientes
          <Badge variant="warning" className="ml-2">{counts.pending}</Badge>
        </TabsTrigger>
        <TabsTrigger value="confirmed" className={getTabClass('confirmed')}>
          Confirmadas
          <Badge variant="success" className="ml-2">{counts.confirmed}</Badge>
        </TabsTrigger>
        <TabsTrigger value="rejected" className={getTabClass('rejected')}>
          Descartadas
          <Badge variant="danger" className="ml-2">{counts.rejected}</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-0"></TabsContent>
      <TabsContent value="pending" className="mt-0"></TabsContent>
      <TabsContent value="confirmed" className="mt-0"></TabsContent>
      <TabsContent value="rejected" className="mt-0"></TabsContent>
    </Tabs>
  );
}