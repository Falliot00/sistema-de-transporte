// frontend/types/index.ts
// ... (existing types remain the same)
export type AlarmStatus = 'pending' | 'suspicious' | 'confirmed' | 'rejected';

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string; 
    timestamp?: string; 
}


export interface Alarm {
    id: string;
    status: AlarmStatus;
    rawStatus?: string;
    type: string;
    timestamp: string;
    videoProcessing?: boolean;
    // --- INICIO DE LA MODIFICACIÓN ---
    // Se añade el campo opcional speed
    speed?: number;
    // --- FIN DE LA MODIFICACIÓN ---
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    driver: {
        id: string;
        name: string;
        license: string;
    };
    vehicle: {
        id: string;
        licensePlate: string;
        model: string;
        interno?: string;
    };
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
// ... (rest of the file remains the same)
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

export interface Driver {
    id: string;
    name: string;
    license: string;
    totalAlarms?: number;
    confirmationRate?: number;
    efficiencyScore?: number;
    avatar?: string;
}

export interface Device {
    id: string;
    name: string;
    serialNumber: string;
    status?: 'active' | 'maintenance' | 'offline';
    lastActivity?: string;
    alarmCount?: number;
    location?: string;
}