// frontend/types/index.ts
export type AlarmStatus = 'pending' | 'suspicious' | 'confirmed' | 'rejected';

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string; 
    timestamp?: string; 
}

// Se alinea el tipo Driver con el modelo Choferes de Prisma
export interface Driver {
    id: string; // Será choferes_id convertido a string
    name: string;
    license: string; // Usaremos DNI aquí
    // Campos opcionales que pueden venir de la DB
    avatar?: string;
    totalAlarms?: number;
    confirmationRate?: number;
    efficiencyScore?: number;
}


export interface Alarm {
    id: string;
    status: AlarmStatus;
    rawStatus?: string;
    type: string;
    timestamp: string;
    videoProcessing?: boolean;
    speed?: number;
    descripcion?: string; // NUEVO: Se añade el campo descripción.
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    driver: Driver; // MODIFICADO: ahora es un objeto Driver completo, no solo `id` y `name`.
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

// ... (El resto de los tipos como PaginationInfo, GlobalAlarmCounts, GetAlarmsResponse, GetAlarmsParams, KPI, etc., se mantienen igual)
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
}

// ... (resto de tipos sin cambios)
// --- FIN DE LA SOLUCIÓN ---


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