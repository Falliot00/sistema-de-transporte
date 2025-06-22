// frontend/types/index.ts

export type AlarmStatus = 'pending' | 'suspicious' | 'confirmed' | 'rejected';

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string; 
    timestamp?: string; 
}

export interface DriverStats {
    total: number;
    pending: number;
    suspicious: number;
    confirmed: number;
    rejected: number;
}

export interface Driver {
    choferes_id: number;
    nombre: string;
    apellido: string;
    foto: string | null;
    dni: string | null;
    anios: number | null;
    empresa: string | null;
    stats?: DriverStats;
    alarmas?: Alarm[];
}

export interface Vehicle {
    id: string;
    licensePlate: string;
    model: string;
    interno?: string;
    company?: string;
}

export interface Alarm {
    id: string;
    status: AlarmStatus;
    rawStatus?: string;
    type: string;
    timestamp: string;
    videoProcessing?: boolean;
    speed?: number;
    descripcion?: string;
    company?: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    driver: {
        id: string;
        name: string;
        license: string;
        company?: string;
    };
    vehicle: Vehicle;
    device: {
        id: string;
        name: string;
        serialNumber: string;
    };
    media: MediaItem[];
    comments: string[];
    reviewer?: {
        id: string;
        name: string;
        email: string;
    };
    reviewedAt?: string;
}

export interface PaginationInfo {
    totalAlarms: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface GlobalAlarmCounts {
    total: number;
    pending: number;
    suspicious: number;
    confirmed: number;
    rejected: number;
}

export interface GetAlarmsResponse {
    alarms: Alarm[];
    pagination: PaginationInfo;
    globalCounts: GlobalAlarmCounts;
}
export interface GetAlarmsParams {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    type?: string[];
    startDate?: string;
    endDate?: string;
    // --- INICIO DE LA SOLUCIÓN: Añadir nuevo parámetro ---
    company?: string[];
    // --- FIN DE LA SOLUCIÓN ---
}

export interface KPI {
    id: string;
    title: string;
    value: string | number;
    icon: string; 
    delta?: number;
    deltaType?: 'increase' | 'decrease' | 'neutral';
    suffix?: string;
}

export type AlarmType = 'Distracción del conductor' | 'Sin cinturón' | 'Cabeza baja' | 'Detección de fatiga' | 'Comportamiento anormal';

export interface Device {
    id: string;
    name: string;
    serialNumber: string;
    status?: 'active' | 'maintenance' | 'offline';
    lastActivity?: string;
    alarmCount?: number;
    location?: string;
}