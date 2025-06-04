import { Alarm, AlarmStatus, AlarmType, KPI } from '@/types';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Smartphone, 
  BellRing, 
  Car, 
  AlertTriangle 
} from 'lucide-react';

// Helper functions to generate random data
const randomId = () => Math.random().toString(36).substring(2, 10);

const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

// Generate mock KPI data
export const mockKPIs: KPI[] = [
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

// Generate mock alarms
const alarmTypes: AlarmType[] = ['phone', 'seatbelt', 'speed', 'fatigue', 'distraction'];
const alarmStatuses: AlarmStatus[] = ['pending', 'confirmed', 'rejected'];
const drivers = [
  { name: 'Juan Pérez', license: 'DRV-2345' },
  { name: 'Carlos Rodríguez', license: 'DRV-7890' },
  { name: 'Miguel Ángel García', license: 'DRV-1239' },
  { name: 'José Luis Martínez', license: 'DRV-4567' },
  { name: 'Francisco González', license: 'DRV-8901' }
];
const vehicles = [
  { licensePlate: 'ABC-123', model: 'Mercedes Benz O500' },
  { licensePlate: 'XYZ-789', model: 'Volvo B450' },
  { licensePlate: 'DEF-456', model: 'Scania K410' },
  { licensePlate: 'GHI-789', model: 'Mercedes Benz O400' },
  { licensePlate: 'JKL-012', model: 'Volvo B380' }
];
const devices = [
  { name: 'Dispositivo A', serialNumber: 'SN-1234567' },
  { name: 'Dispositivo B', serialNumber: 'SN-2345678' },
  { name: 'Dispositivo C', serialNumber: 'SN-3456789' },
  { name: 'Dispositivo D', serialNumber: 'SN-4567890' },
  { name: 'Dispositivo E', serialNumber: 'SN-5678901' }
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
    url: `https://source.unsplash.com/random/800x600?${alarmType}`,
    thumbnailUrl: `https://source.unsplash.com/random/300x200?${alarmType}`,
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
        id: randomId(),
        name: driver.name,
        license: driver.license
      },
      vehicle: {
        id: randomId(),
        licensePlate: vehicle.licensePlate,
        model: vehicle.model
      },
      device: {
        id: randomId(),
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
    'alert-triangle': AlertTriangle
  };
  
  return icons[iconName as keyof typeof icons] || Bell;
};

// Helper to filter alarms
export const filterAlarms = (alarms: Alarm[], filters: {
  search?: string;
  status?: AlarmStatus[];
  type?: AlarmType[];
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
    
    return true;
  });
};