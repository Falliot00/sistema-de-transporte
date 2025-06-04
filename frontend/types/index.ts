export type AlarmStatus = 'pending' | 'confirmed' | 'rejected';

export type AlarmType = 'phone' | 'seatbelt' | 'speed' | 'fatigue' | 'distraction';

export interface Driver {
  id: string;
  name: string;
  license: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
}

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
}

export interface Reviewer {
  id: string;
  name: string;
  email: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
  };
  timestamp: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Alarm {
  id: string;
  status: AlarmStatus;
  type: AlarmType;
  driver: Driver;
  vehicle: Vehicle;
  device: Device;
  location: Location;
  timestamp: string;
  media: MediaItem[];
  comments: Comment[];
  reviewer?: Reviewer;
  reviewedAt?: string;
}

export interface KPI {
  id: string;
  title: string;
  value: number;
  icon: string;
  delta?: number;
  deltaType?: 'increase' | 'decrease';
}

export interface AlarmFilterParams {
  search?: string;
  status?: AlarmStatus[];
  type?: AlarmType[];
  startDate?: string;
  endDate?: string;
}

export interface AlarmState {
  alarms: Alarm[];
  filteredAlarms: Alarm[];
  selectedAlarm: Alarm | null;
  filterParams: AlarmFilterParams;
  isModalOpen: boolean;
}