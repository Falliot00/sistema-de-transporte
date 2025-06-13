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

export interface GlobalAlarmCounts {
    total: number;
    pending: number;
    confirmed: number;
    rejected: number;
}

export interface GetAlarmsResponse {
    alarms: Alarm[];
    pagination: PaginationInfo;
    globalCounts: GlobalAlarmCounts;
}

// Interfaz para los parámetros de la función getAlarms
export interface GetAlarmsParams {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    type?: string[]; // <--- Asegúrate de que esta línea esté presente
}