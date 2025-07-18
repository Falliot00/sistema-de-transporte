// frontend/types/index.ts

export type AlarmStatus = 'pending' | 'suspicious' | 'confirmed' | 'rejected';
export type AlarmType = string; // Hacemos que sea un string genérico

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string; 
}

export interface DriverStats {
    total: number;
    pending: number;
    suspicious: number;
    confirmed: number;
    rejected: number;
}

// Representa un chofer en una lista o como detalle
export interface Driver {
    choferes_id: number;
    // --- CAMBIO: Unificamos a un solo campo ---
    apellido_nombre: string;
    foto: string | null;
    dni: string | null;
    anios: number | null; // Este campo es el legajo
    empresa: string | null;
    estado?: string;
    sector?: string;
    puesto?: string;
    stats?: DriverStats;
    alarmas?: Alarm[];
}

// Representa un chofer dentro de una alarma (versión simplificada)
export interface AlarmDriver {
    id: string;
    // --- CAMBIO: 'name' se convierte en 'apellido_nombre' por consistencia ---
    apellido_nombre: string;
    license: string;
    company?: string;
}

export interface Vehicle {
    id: string;
    licensePlate: string;
    model: string;
    interno?: string;
    company?: string;
}

// --- NUEVO: Tipo para la anomalía ---
export interface Anomalia {
    id: number;
    nombre: string;
    descripcion: string;
}
export interface Alarm {
    id: string;
    status: AlarmStatus;
    rawStatus?: string;
    type: AlarmType;
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
    driver: AlarmDriver | null;
    vehicle: Vehicle | null;
    device: {
        id: string;
        name: string;
        serialNumber: string;
    } | null;
    media: MediaItem[];
    // --- NUEVO: Añadimos el campo de anomalía, que puede ser nulo ---
    anomalia: Anomalia | null;
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
    company?: string[];
}

// Tipos para el Dashboard
export interface DashboardKPIs {
    totalAlarms: number;
    confirmationRate: string;
}

export interface AlarmsByDay {
    name: string;
    Total: number;
    Confirmadas: number;
    Pendientes: number;
}

export interface AlarmsByType {
    name: string;
    value: number;
    fill: string;
}

export interface AlarmStatusProgress {
    title: string;
    value: number;
    total: number;
    color?: string;
}

export interface HourlyDistribution {
    hour: string;
    alarmas: number;
}

export interface WeeklyTrend {
    name: string;
    EsteSemana: number;
    SemanaPasada: number;
}

export interface DriverRanking {
    id: number;
    name: string;
    avatar: string | null;
    totalAlarms: number;
    confirmationRate: number;
    efficiencyScore: number;
}

export interface Device {
    id: string;
    name: string;
    serialNumber: string;
    status: 'active' | 'maintenance' | 'offline';
    alarmCount: number;
}

export interface DeviceSummary {
    active: number;
    maintenance: number;
    offline: number;
    total: number;
}

export interface DashboardSummary {
    kpis: DashboardKPIs;
    alarmsByDay: AlarmsByDay[];
    alarmsByType: AlarmsByType[];
    alarmStatusProgress: AlarmStatusProgress[];
    hourlyDistribution: HourlyDistribution[];
    weeklyTrend: WeeklyTrend[];
    driverRanking: DriverRanking[];
    deviceSummary: DeviceSummary;
    topDevices: Device[];
}