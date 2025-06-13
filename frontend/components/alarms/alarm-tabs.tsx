"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Ya no importamos AlarmsPage ni DashboardPage aquí.

type AlarmTabsProps = {
  listTabContent: React.ReactNode;
  dashboardTabContent: React.ReactNode;
}

export function AlarmTabs({ listTabContent, dashboardTabContent }: AlarmTabsProps) {
  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list">Lista de Alarmas</TabsTrigger>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        {listTabContent}
      </TabsContent>
      <TabsContent value="dashboard">
        {dashboardTabContent}
      </TabsContent>
    </Tabs>
  )
}