// frontend/lib/mock-data.ts

// Solo se importan los tipos que son necesarios para las constantes o funciones que se mantienen.
// Alarm, KPI, Driver, Device no son necesarios si no se generan mocks.
import { AlarmType } from '@/types'; 

// EXPORTAR alarmTypes para su uso en AdvancedFilters
// Esta lista estática define todos los tipos de alarma posibles para los filtros.
export const alarmTypes: AlarmType[] = [
  'Distracción del conductor', 
  'Sin cinturón', 
  'Cabeza baja', 
  'Detección de fatiga', 
  'Comportamiento anormal'
];

// Todo el código que generaba datos mock ficticios, KPIs, conductores, vehículos,
// dispositivos, etc., ha sido eliminado porque ya no es utilizado directamente por
// la UI después de las refactorizaciones.

// Las funciones de ayuda como randomId, randomElement, randomNumber, randomDate
// también han sido eliminadas ya que no son necesarias sin los generadores de mocks.

// Las funciones getAlarmsByStatus, getAlarmCounts, getIconByName, filterAlarms,
// getMockAlarmsByDay, getMockAlarmsByType, getMockAlarmStatusProgress,
// getMockHourlyDistribution, getMockWeeklyTrend, getMockDriverRanking,
// getMockDeviceStatusSummary, getMockTopDevices, junto con mockPageKPIs
// y mockDashboardKPIs, han sido eliminadas ya que no se llaman desde la UI.

// La importación de getTypeText ha sido eliminada ya que ya no se usa aquí.