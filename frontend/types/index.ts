// frontend/types/index.ts

export interface Alarm {
    id: string;
    status: 'pending' | 'confirmed' | 'rejected';
    type: string;
    timestamp: string;
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
    media: {
        id: string;
        type: 'image' | 'video';
        url: string;
    }[];
    comments: string[];
}

export interface PaginationInfo {
    totalAlarms: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// Nueva interfaz para los conteos globales de alarmas
export interface GlobalAlarmCounts {
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
}

// Nueva interfaz para la respuesta completa de la API de obtener alarmas
export interface GetAlarmsResponse {
    alarms: Alarm[];
    pagination: PaginationInfo;
    globalCounts: GlobalAlarmCounts; // Aquí se incluyen los conteos globales
}

// Interfaz para los parámetros de la función getAlarms
export interface GetAlarmsParams {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    type?: string[]; // Si planeas usar este filtro en el backend
}