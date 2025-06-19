// frontend/types/index.ts

export type AlarmStatus = 'pending' | 'suspicious' | 'confirmed' | 'rejected';

// NUEVA INTERFAZ EXPORTADA: MediaItem
export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string; // Si usas miniaturas para imágenes/videos
    timestamp?: string; // Opcional, si cada media tiene su propio timestamp
}

export interface Alarm {
    id: string;
    status: AlarmStatus;
    rawStatus?: string;
    type: string;
    timestamp: string;
    videoProcessing?: boolean;
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
    };
    device: {
        id: string;
        name: string;
        serialNumber: string;
    };
    media: MediaItem[]; // <-- Ahora usa la interfaz MediaItem exportada
    comments: string[];
    // Añadir propiedades opcionales para la revisión si aún no están:
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
}

// También es buena práctica definir un tipo para los KPI si se usan en mock-data.ts y en la UI
export interface KPI {
    id: string;
    title: string;
    value: string | number;
    icon: string; // Nombre del icono como string
    delta?: number;
    deltaType?: 'increase' | 'decrease' | 'neutral';
    suffix?: string;
}

// Tipo de alarma (para los filtros en AdvancedFilters)
// Basado en el uso en mock-data.ts
export type AlarmType = 'Distracción del conductor' | 'Sin cinturón' | 'Cabeza baja' | 'Detección de fatiga' | 'Comportamiento anormal';

// Interfaz para Driver (utilizado en Dashboard > ChoferesTab)
export interface Driver {
    id: string;
    name: string;
    license: string;
    totalAlarms?: number;
    confirmationRate?: number;
    efficiencyScore?: number;
    avatar?: string;
}

// Interfaz para Device (utilizado en Dashboard > DispositivosTab)
export interface Device {
    id: string;
    name: string;
    serialNumber: string;
    status?: 'active' | 'maintenance' | 'offline';
    lastActivity?: string;
    alarmCount?: number;
    location?: string;
}