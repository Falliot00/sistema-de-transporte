// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/lib/mock-data.ts
import { Alarm, AlarmStatus, AlarmType, KPI, Driver, Device } from '@/types'; // Added Driver, Device
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  BellRing, 
  Car, 
  AlertTriangle,
  Users,       // For Choferes
  Server,      // For Dispositivos
  Activity,    // For Tiempo de respuesta
  Percent,     // For Tasa de confirmacion
  LineChart,   // For Dashboard Nav
  SettingsIcon // For Settings Nav (if not already used)
} from 'lucide-react';

// Helper functions to generate random data
const randomId = () => Math.random().toString(36).substring(2, 10);

const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

// Extended mock KPI data for the main page (if needed, or keep as is)
export const mockPageKPIs: KPI[] = [
  {
    id: "total-alarms",
    title: "Total Alarmas",
    value: 254,
    icon: 'bell', // Existing
    delta: 12,
    deltaType: 'increase'
  },
  {
    id: "pending-alarms",
    title: "Alarmas Pendientes",
    value: 42,
    icon: 'clock', // Existing
    delta: 4,
    deltaType: 'increase'
  },
  {
    id: "confirmed-alarms",
    title: "Alarmas Confirmadas",
    value: 187,
    icon: 'check-circle', // Existing
    delta: 7,
    deltaType: 'increase'
  },
  {
    id: "rejected-alarms",
    title: "Alarmas Descartadas",
    value: 25,
    icon: 'x-circle', // Existing
    delta: 1,
    deltaType: 'decrease'
  }
];


// Generate mock KPI data for Dashboard Page
export const mockDashboardKPIs: KPI[] = [
  {
    id: "dashboard-total-alarms",
    title: "Total Alarmas (Mes)",
    value: 1238,
    icon: 'bell',
    delta: 55,
    deltaType: 'increase',
  },
  {
    id: "dashboard-confirmation-rate",
    title: "Tasa de Confirmación",
    value: 78, // Representing 78%
    icon: 'percent', // Needs mapping in getIconByName
    delta: -2,
    deltaType: 'decrease',
    suffix: '%', // Custom property for display
  },
  {
    id: "dashboard-response-time",
    title: "Tiempo Resp. Prom.",
    value: 12, // Representing 12 minutes
    icon: 'activity', // Needs mapping in getIconByName
    delta: 1,
    deltaType: 'increase', // Increase is bad for response time
    suffix: ' min', // Custom property for display
  },
  {
    id: "dashboard-active-devices",
    title: "Dispositivos Activos",
    value: 142,
    icon: 'server', // Needs mapping in getIconByName
    delta: 3,
    deltaType: 'increase',
  },
];


// Generate mock alarms (existing function, ensure it's complete)
const alarmTypes: AlarmType[] = ['phone', 'seatbelt', 'speed', 'fatigue', 'distraction'];
const alarmStatuses: AlarmStatus[] = ['pending', 'confirmed', 'rejected'];
const drivers: Array<{ name: string; license: string; id?: string; totalAlarms?: number; confirmationRate?: number; efficiencyScore?: number, avatar?: string }> = [ // Extended Driver for dashboard
  { id: 'drv_1', name: 'Juan Pérez', license: 'DRV-2345', totalAlarms: randomNumber(20,50), confirmationRate: randomNumber(60,95), efficiencyScore: randomNumber(70,98), avatar: '/avatars/01.png' },
  { id: 'drv_2', name: 'Carlos Rodríguez', license: 'DRV-7890', totalAlarms: randomNumber(10,40), confirmationRate: randomNumber(50,90), efficiencyScore: randomNumber(60,95), avatar: '/avatars/02.png' },
  { id: 'drv_3', name: 'Miguel Ángel García', license: 'DRV-1239', totalAlarms: randomNumber(5,30), confirmationRate: randomNumber(70,99), efficiencyScore: randomNumber(80,99), avatar: '/avatars/03.png' },
  { id: 'drv_4', name: 'José Luis Martínez', license: 'DRV-4567', totalAlarms: randomNumber(15,45), confirmationRate: randomNumber(65,92), efficiencyScore: randomNumber(68,96), avatar: '/avatars/04.png' },
  { id: 'drv_5', name: 'Francisco González', license: 'DRV-8901', totalAlarms: randomNumber(25,55), confirmationRate: randomNumber(55,88), efficiencyScore: randomNumber(58,90), avatar: '/avatars/05.png' }
];
const vehicles = [
  { licensePlate: 'ABC-123', model: 'Mercedes Benz O500' },
  { licensePlate: 'XYZ-789', model: 'Volvo B450' },
  { licensePlate: 'DEF-456', model: 'Scania K410' },
  { licensePlate: 'GHI-789', model: 'Mercedes Benz O400' },
  { licensePlate: 'JKL-012', model: 'Volvo B380' }
];
const devices: Array<{ id?: string; name: string; serialNumber: string; status?: 'active' | 'maintenance' | 'offline'; lastActivity?: string; alarmCount?: number; location?: string}> = [ // Extended Device for dashboard
  { id: 'dev_1', name: 'Dispositivo A', serialNumber: 'SN-1234567', status: 'active', lastActivity: randomDate(new Date(2024,4,1), new Date()), alarmCount: randomNumber(5,20), location: 'Zona Norte' },
  { id: 'dev_2', name: 'Dispositivo B', serialNumber: 'SN-2345678', status: 'maintenance', lastActivity: randomDate(new Date(2024,3,1), new Date()), alarmCount: randomNumber(2,10), location: 'Zona Sur'},
  { id: 'dev_3', name: 'Dispositivo C', serialNumber: 'SN-3456789', status: 'active', lastActivity: randomDate(new Date(2024,4,10), new Date()), alarmCount: randomNumber(10,30), location: 'Zona Centro'},
  { id: 'dev_4', name: 'Dispositivo D', serialNumber: 'SN-4567890', status: 'offline', lastActivity: randomDate(new Date(2024,2,1), new Date()), alarmCount: randomNumber(1,5), location: 'Zona Oeste'},
  { id: 'dev_5', name: 'Dispositivo E', serialNumber: 'SN-5678901', status: 'active', lastActivity: randomDate(new Date(2024,4,15), new Date()), alarmCount: randomNumber(8,25), location: 'Zona Este'}
];
const reviewers = [
  { name: 'Admin Usuario', email: 'admin@example.com' },
  { name: 'Supervisor A', email: 'supervisora@example.com' },
  { name: 'Supervisor B', email: 'supervisorb@example.com' }
];

const generateMediaItems = (alarmType: AlarmType) => {
  const count = Math.floor(Math.random() * 4) + 1;
  return Array.from({ length: count }).map((_, index) => ({
    id: randomId(),
    type: index === 0 ? 'video' : 'image',
    url: `https://picsum.photos/seed/${randomId()}/800/600`, // Using picsum for variety
    thumbnailUrl: `https://picsum.photos/seed/${randomId()}/300/200`,
    timestamp: randomDate(new Date(2023, 0, 1), new Date())
  }));
};

const generateComments = () => {
  const count = Math.floor(Math.random() * 3);
  return Array.from({ length: count }).map(() => ({
    id: randomId(),
    text: 'Este es un comentario de ejemplo sobre la alarma detectada.',
    author: {
      id: randomId(),
      name: randomElement(reviewers).name
    },
    timestamp: randomDate(new Date(2023, 0, 1), new Date())
  }));
};

const generateLocation = () => {
  return {
    latitude: -31.6 + Math.random() * 0.5, // Around Santa Fe, Argentina
    longitude: -60.7 + Math.random() * 0.5,
    address: 'Av. Rivadavia 1234, Santa Fe, Argentina'
  };
};

export const generateMockAlarms = (count: number): Alarm[] => {
  return Array.from({ length: count }).map(() => {
    const type = randomElement(alarmTypes);
    const status = randomElement(alarmStatuses);
    const driver = randomElement(drivers);
    const vehicle = randomElement(vehicles);
    const device = randomElement(devices);
    const hasReviewer = status !== 'pending';
    const reviewer = hasReviewer ? randomElement(reviewers) : undefined;

    return {
      id: `ALM-${Math.floor(Math.random() * 10000)}`,
      status,
      type,
      driver: {
        id: driver.id || randomId(),
        name: driver.name,
        license: driver.license
      },
      vehicle: {
        id: randomId(),
        licensePlate: vehicle.licensePlate,
        model: vehicle.model
      },
      device: {
        id: device.id || randomId(),
        name: device.name,
        serialNumber: device.serialNumber
      },
      location: generateLocation(),
      timestamp: randomDate(new Date(2023, 0, 1), new Date()),
      media: generateMediaItems(type),
      comments: generateComments(),
      reviewer: hasReviewer ? {
        id: randomId(),
        name: reviewer?.name ?? '',
        email: reviewer?.email ?? ''
      } : undefined,
      reviewedAt: hasReviewer ? randomDate(new Date(2023, 0, 1), new Date()) : undefined
    };
  });
};

// Generate initial mock alarms
export const generateInitialMockAlarms = () => generateMockAlarms(50);

// Helper function to get alarms by status
export const getAlarmsByStatus = (alarms: Alarm[], status: AlarmStatus | 'all'): Alarm[] => {
  if (status === 'all') return alarms;
  return alarms.filter(alarm => alarm.status === status);
};

// Get counts by status
export const getAlarmCounts = (alarms: Alarm[]) => {
  return {
    all: alarms.length,
    pending: alarms.filter(a => a.status === 'pending').length,
    confirmed: alarms.filter(a => a.status === 'confirmed').length,
    rejected: alarms.filter(a => a.status === 'rejected').length
  };
};

// Helper function to get icon component by name
export const getIconByName = (iconName: string) => {
  const icons = {
    'bell': Bell,
    'clock': Clock,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    'smartphone': Smartphone,
    'bell-ring': BellRing,
    'car': Car,
    'alert-triangle': AlertTriangle,
    'users': Users,
    'server': Server,
    'activity': Activity,
    'percent': Percent,
    'line-chart': LineChart,
    'settings': SettingsIcon,
    // Add any other icons you need for dashboard KPIs or navigation
  };
  
  return icons[iconName as keyof typeof icons] || Bell; // Default to Bell icon
};

// Helper to filter alarms
export const filterAlarms = (alarms: Alarm[], filters: {
  search?: string;
  status?: AlarmStatus[];
  type?: AlarmType[];
  // Add startDate and endDate if date filtering is implemented
  startDate?: string;
  endDate?: string;
}): Alarm[] => {
  return alarms.filter(alarm => {
    // Filter by search
    if (filters.search && filters.search.length > 0) {
      const searchLower = filters.search.toLowerCase();
      const matchesDriver = alarm.driver.name.toLowerCase().includes(searchLower);
      const matchesVehicle = alarm.vehicle.licensePlate.toLowerCase().includes(searchLower);
      const matchesId = alarm.id.toLowerCase().includes(searchLower);
      
      if (!matchesDriver && !matchesVehicle && !matchesId) {
        return false;
      }
    }
    
    // Filter by status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(alarm.status)) {
        return false;
      }
    }
    
    // Filter by type
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(alarm.type)) {
        return false;
      }
    }
    
    // Filter by date range (example)
    if (filters.startDate && new Date(alarm.timestamp) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(alarm.timestamp) > new Date(filters.endDate)) {
      return false;
    }
    
    return true;
  });
};

// Mock data for Alarms By Day Chart (Resumen Tab)
export const getMockAlarmsByDay = (days = 30) => {
  const today = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      name: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      Total: randomNumber(5, 50),
      Confirmadas: randomNumber(0, 40),
      Pendientes: randomNumber(0, 10),
    });
  }
  return data;
};

// Mock data for Alarms By Type Pie Chart (Resumen Tab)
export const getMockAlarmsByType = () => {
  return alarmTypes.map(type => ({
    name: getTypeText(type), // Use existing helper
    value: randomNumber(10, 100),
    fill: `var(--chart-${randomNumber(1,5)})` // Use tailwind chart colors
  }));
};

// Mock data for Alarm Status Progress (Resumen Tab)
export const getMockAlarmStatusProgress = (allAlarms: Alarm[]) => {
  const counts = getAlarmCounts(allAlarms);
  return [
    { title: "Pendientes", value: counts.pending, total: counts.all, color: "hsl(var(--chart-4))" }, // yellow-ish
    { title: "Confirmadas", value: counts.confirmed, total: counts.all, color: "hsl(var(--chart-2))" }, // green-ish
    { title: "Descartadas", value: counts.rejected, total: counts.all, color: "hsl(var(--chart-1))" }, // red-ish
  ];
};


// Mock data for Hourly Distribution Chart (Tendencias Tab)
export const getMockHourlyDistribution = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      hour: `${String(i).padStart(2, '0')}:00`,
      alarmas: randomNumber(0, 30),
    });
  }
  return data;
};

// Mock data for Weekly Trend Chart (Tendencias Tab)
export const getMockWeeklyTrend = () => {
  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return daysOfWeek.map(day => ({
    name: day,
    EsteSemana: randomNumber(10, 70),
    SemanaPasada: randomNumber(10, 70),
  }));
};

// Mock data for Driver Ranking (Choferes Tab)
export const getMockDriverRanking = (): Driver[] => {
  // Sort drivers by a metric, e.g., efficiencyScore descending
  return [...drivers].sort((a, b) => (b.efficiencyScore || 0) - (a.efficiencyScore || 0));
};

// Mock data for Device Status Summary (Dispositivos Tab)
export const getMockDeviceStatusSummary = () => {
  const active = devices.filter(d => d.status === 'active').length;
  const maintenance = devices.filter(d => d.status === 'maintenance').length;
  const offline = devices.filter(d => d.status === 'offline').length;
  return { active, maintenance, offline, total: devices.length };
};

// Mock data for Top Devices (Dispositivos Tab)
export const getMockTopDevices = (): Device[] => {
  // Sort devices by alarm count, descending
  return [...devices].sort((a, b) => (b.alarmCount || 0) - (a.alarmCount || 0)).slice(0, 5); // Top 5
};