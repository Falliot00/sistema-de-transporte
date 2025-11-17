// frontend/types/index.ts

// --- TIPOS BÁSICOS Y DE ALARMAS ---

export type AlarmStatus = 'pending' | 'suspicious' | 'confirmed' | 'rejected';
export type AlarmType = string;

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
}

export interface AlarmDriver {
    id: string;
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
    informada?: boolean; // Nueva columna informada
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
    anomalia: Anomaly | null; 
    comments: string[];
}

// --- TIPOS PARA RESPUESTAS DE API Y PARÁMETROS ---

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
    filteredCounts: GlobalAlarmCounts;
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
    includeRejected?: boolean;
}

// --- TIPOS DE CHOFERES ---

export interface DriverStats {
    total: number;
    pending: number;
    suspicious: number;
    confirmed: number;
    rejected: number;
}

export interface DriverReport {
    id: number;
    fecha: string; // ISO date
    hora: string; // ISO time
    url: string | null;
    totalAlarmas: number;
}

export interface Driver {
    choferes_id: number;
    apellido_nombre: string;
    foto: string | null;
    dni: string | null;
    anios: number | null;
    empresa: string | null;
    estado?: string;
    sector?: string;
    puesto?: string;
    stats?: DriverStats;
    alarmas?: Alarm[];
    informes?: DriverReport[];
}

// --- TIPOS DE DISPOSITIVOS (NUEVOS Y ACTUALIZADOS) ---

// Tipo que se usa en el Dashboard (lo mantenemos por consistencia)
export interface Device {
    id: number;
    name: string; // "Interno XXX"
    serialNumber: string; // Patente
    status: 'active' | 'maintenance' | 'offline';
    alarmCount: number;
}

// Tipo para un dispositivo en la nueva lista general /devices
export interface DeviceListItem {
    id: number;
    idDispositivo: number;
    nroInterno: number | null;
    patente: string | null;
    sim: string | null;
    totalAlarmas: number;
}

// Tipo para las estadísticas de un dispositivo específico
export interface DeviceStats {
    totalAlarms: number;
    totalAlarmsConfirmed: number;
    alarmsByWeekday: {
        dayName: string;
        dayOfWeek: number;
        total: number;
    }[];
}

// Tipo para los tipos de alarmas más frecuentes de un dispositivo
export interface TopAlarmType {
    name: string;
    count: number;
}

// Tipo para el detalle completo de un dispositivo
export interface DeviceDetails extends DeviceListItem {
    did: number | null;
    stats: DeviceStats;
    topAlarmTypes: TopAlarmType[];
}


// --- TIPOS PARA EL DASHBOARD ---

export interface DashboardKPIs {
    totalAlarms: number;
    confirmationRate: string;
    avgAlarmsPerDriver: string;
    avgAlarmsPerDevice: string;
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

export interface DriverRanking {
    id: number;
    name: string;
    avatar: string | null;
    totalAlarms: number;
    confirmedAlarms: number;
    confirmationRate: number;
    efficiencyScore: number;
}

export interface DashboardSummary {
    kpis: DashboardKPIs;
    alarmsByDay: AlarmsByDay[];
    alarmsByType: AlarmsByType[];
    alarmStatusProgress: AlarmStatusProgress[];
    hourlyDistribution: HourlyDistribution[];
    driverRanking: DriverRanking[];
    topDevices: Device[];
}

export interface Anomaly {
    idAnomalia: number;
    nomAnomalia: string | null;
    descAnomalia: string | null;
}

export interface DeviceSummary {
  active: number;
  maintenance: number;
  offline: number;
  total: number;
}
