// falliot00/sistema-de-transporte/sistema-de-transporte-68d12784822acbe2b401f2b19fd63835d0745bf6/lib/mock-data.ts
import { Alarm, AlarmStatus, AlarmType, KPI, Driver, Device } from '@/types';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  BellRing, 
  Car, 
  AlertTriangle,
  Users,
  Server,
  Activity,
  Percent,
  LineChart,
  Settings as SettingsIcon // Renamed to avoid conflict if Settings is imported elsewhere
} from 'lucide-react';
import { getTypeText } from '@/lib/utils'; // <<<--- ADDED THIS IMPORT

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

// Extended mock KPI data for the main page
export const mockPageKPIs: KPI[] = [
  {
    id: "total-alarms",
    title: "Total Alarmas",
    value: 254,
    icon: 'bell',
    delta: 12,
    deltaType: 'increase'
  },
  {
    id: "pending-alarms",
    title: "Alarmas Pendientes",
    value: 42,
    icon: 'clock',
    delta: 4,
    deltaType: 'increase'
  },
  {
    id: "confirmed-alarms",
    title: "Alarmas Confirmadas",
    value: 187,
    icon: 'check-circle',
    delta: 7,
    deltaType: 'increase'
  },
  {
    id: "rejected-alarms",
    title: "Alarmas Descartadas",
    value: 25,
    icon: 'x-circle',
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
    icon: 'percent',
    delta: -2,
    deltaType: 'decrease',
    suffix: '%', 
  },
  {
    id: "dashboard-response-time",
    title: "Tiempo Resp. Prom.",
    value: 12, // Representing 12 minutes
    icon: 'activity', 
    delta: 1,
    deltaType: 'increase', 
    suffix: ' min', 
  },
  {
    id: "dashboard-active-devices",
    title: "Dispositivos Activos",
    value: 142,
    icon: 'server', 
    delta: 3,
    deltaType: 'increase',
  },
];


const alarmTypes: AlarmType[] = ['phone', 'seatbelt', 'speed', 'fatigue', 'distraction'];
const alarmStatuses: AlarmStatus[] = ['pending', 'confirmed', 'rejected'];
const drivers: Array<{ name: string; license: string; id?: string; totalAlarms?: number; confirmationRate?: number; efficiencyScore?: number, avatar?: string }> = [
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
const devices: Array<{ id?: string; name: string; serialNumber: string; status?: 'active' | 'maintenance' | 'offline'; lastActivity?: string; alarmCount?: number; location?: string}> = [
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
    url: `https://picsum.photos/seed/${randomId()}/800/600`,
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
    latitude: -31.6 + Math.random() * 0.5, 
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
    const reviewerData = hasReviewer ? randomElement(reviewers) : undefined; // Corrected variable name

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
      reviewer: hasReviewer && reviewerData ? { // Added null check for reviewerData
        id: randomId(),
        name: reviewerData.name,
        email: reviewerData.email
      } : undefined,
      reviewedAt: hasReviewer ? randomDate(new Date(2023, 0, 1), new Date()) : undefined
    };
  });
};

export const generateInitialMockAlarms = () => generateMockAlarms(50);

export const getAlarmsByStatus = (alarms: Alarm[], status: AlarmStatus | 'all'): Alarm[] => {
  if (status === 'all') return alarms;
  return alarms.filter(alarm => alarm.status === status);
};

export const getAlarmCounts = (alarms: Alarm[]) => {
  return {
    all: alarms.length,
    pending: alarms.filter(a => a.status === 'pending').length,
    confirmed: alarms.filter(a => a.status === 'confirmed').length,
    rejected: alarms.filter(a => a.status === 'rejected').length
  };
};

export const getIconByName = (iconName: string) => {
  const icons: { [key: string]: React.ElementType } = { // Added index signature
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
  };
  
  return icons[iconName] || Bell;
};

export const filterAlarms = (alarms: Alarm[], filters: {
  search?: string;
  status?: AlarmStatus[];
  type?: AlarmType[];
  startDate?: string;
  endDate?: string;
}): Alarm[] => {
  return alarms.filter(alarm => {
    if (filters.search && filters.search.length > 0) {
      const searchLower = filters.search.toLowerCase();
      const matchesDriver = alarm.driver.name.toLowerCase().includes(searchLower);
      const matchesVehicle = alarm.vehicle.licensePlate.toLowerCase().includes(searchLower);
      const matchesId = alarm.id.toLowerCase().includes(searchLower);
      
      if (!matchesDriver && !matchesVehicle && !matchesId) {
        return false;
      }
    }
    
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(alarm.status)) {
        return false;
      }
    }
    
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(alarm.type)) {
        return false;
      }
    }
    
    if (filters.startDate && new Date(alarm.timestamp) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(alarm.timestamp) > new Date(filters.endDate)) {
      return false;
    }
    
    return true;
  });
};

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

export const getMockAlarmsByType = () => {
  return alarmTypes.map(type => ({
    name: getTypeText(type), // Now getTypeText is defined due to the import
    value: randomNumber(10, 100),
    fill: `var(--chart-${randomNumber(1,5)})`
  }));
};

export const getMockAlarmStatusProgress = (allAlarms: Alarm[]) => {
  const counts = getAlarmCounts(allAlarms);
  return [
    { title: "Pendientes", value: counts.pending, total: counts.all, color: "hsl(var(--chart-4))" },
    { title: "Confirmadas", value: counts.confirmed, total: counts.all, color: "hsl(var(--chart-2))" },
    { title: "Descartadas", value: counts.rejected, total: counts.all, color: "hsl(var(--chart-1))" },
  ];
};

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

export const getMockWeeklyTrend = () => {
  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return daysOfWeek.map(day => ({
    name: day,
    EsteSemana: randomNumber(10, 70),
    SemanaPasada: randomNumber(10, 70),
  }));
};

export const getMockDriverRanking = (): Driver[] => {
  return [...drivers].sort((a, b) => (b.efficiencyScore || 0) - (a.efficiencyScore || 0));
};

export const getMockDeviceStatusSummary = () => {
  const active = devices.filter(d => d.status === 'active').length;
  const maintenance = devices.filter(d => d.status === 'maintenance').length;
  const offline = devices.filter(d => d.status === 'offline').length;
  return { active, maintenance, offline, total: devices.length };
};

export const getMockTopDevices = (): Device[] => {
  return [...devices].sort((a, b) => (b.alarmCount || 0) - (a.alarmCount || 0)).slice(0, 5);
};