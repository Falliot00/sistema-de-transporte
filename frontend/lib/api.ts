// frontend/lib/api.ts
import { 
    Alarm, 
    Driver, 
    GetAlarmsResponse, 
    GetAlarmsParams, 
    DashboardSummary,
    DeviceListItem,
    DeviceDetails,
    Anomaly 
} from "@/types";

const isServer = typeof window === 'undefined';

// API base URL - proxy fuera de /api para evitar colisiones con reverse proxy
const API_URL = '/proxy';



const buildQueryString = (params: Record<string, string | string[] | number | boolean | undefined> | GetAlarmsParams | undefined = {}): string => {
    const query = new URLSearchParams();
    
    if (!params) return '';
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
                if (value.length > 0) { // Solo a�adir si el array no est� vac�o
                    value.forEach(item => query.append(key, item));
                }
            } else {
                query.append(key, String(value));
            }
        }
    });
    
    return query.toString();
}

/**
 * Obtiene una lista paginada y filtrada de alarmas.
 */
export async function getAlarms(params?: GetAlarmsParams): Promise<GetAlarmsResponse> {
  try {
    const query = buildQueryString(params);
    const response = await fetch(`${API_URL}/alarmas?${query}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido al obtener alarmas.' }));
      throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error en getAlarms:", error);
    return {
      alarms: [],
      pagination: { totalAlarms: 0, currentPage: 1, pageSize: 12, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      globalCounts: { total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 }
    };
  }
}

/**
 * Obtiene solo el conteo de alarmas para un conjunto de filtros.
 */
export async function getAlarmsCount(params?: GetAlarmsParams): Promise<{ count: number }> {
    try {
        const query = buildQueryString(params);
        const response = await fetch(`${API_URL}/alarmas/count?${query}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
            throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en getAlarmsCount:", error);
        return { count: 0 };
    }
}

/**
 * Envía una revisión inicial para una alarma (Pendiente -> Sospechosa/Rechazada).
 */
export async function reviewAlarm(alarmId: string, status: 'confirmed' | 'rejected', description?: string, choferId?: number): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status, descripcion: description, choferId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al revisar la alarma');
    }
    return await response.json();
}

/**
 * Asigna o desasigna un chofer a una alarma.
 */
export async function assignDriver(alarmId: string, choferId: number | null): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/assign-driver`, {
        method: 'PATCH',
        body: JSON.stringify({ choferId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al asignar el chofer');
    }
    return await response.json();
}

/**
 * Confirma finalmente una alarma (Sospechosa -> Confirmada).
 * ACTUALIZADO: Ahora incluye anomalyId como parámetro obligatorio
 */
export async function confirmAlarm(alarmId: string, description?: string, choferId?: number, anomalyId?: number): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/confirm`, {
        method: 'PUT',
        body: JSON.stringify({ descripcion: description, choferId, anomalyId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al confirmar la alarma');
    }
    return await response.json();
}

/**
 * Vuelve a poner una alarma Rechazada en estado Sospechosa.
 */
export async function reEvaluateAlarm(alarmId: string, description?: string): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/re-evaluate`, {
        method: 'PUT',
        body: JSON.stringify({ descripcion: description }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al re-evaluar la alarma');
    }
    return await response.json();
}

/**
 * Vuelve a solicitar la descarga del video para una alarma.
 */
export async function retryVideo(alarmId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/retry-video`, {
        method: 'POST',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al reintentar la descarga del video');
    }
    return await response.json();
}

/**
 * Obtiene la lista de todos los choferes activos, con filtros opcionales.
 */
export async function getDrivers(params?: { search?: string; company?: string[] }): Promise<Driver[]> {
    try {
        const query = buildQueryString(params);
        const response = await fetch(`${API_URL}/choferes?${query}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los choferes: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en getDrivers:", error);
        throw error;
    }
}

/**
 * Obtiene los detalles de un chofer específico con filtros opcionales para las alarmas.
 */
export async function getDriverDetails(
    id: string, 
    params?: { 
        startDate?: string; 
        endDate?: string; 
        type?: string[]; 
        company?: string[];
        status?: string;
    }
): Promise<Driver> {
    try {
        const query = buildQueryString(params);
        const response = await fetch(`${API_URL}/choferes/${id}?${query}`);
        if (!response.ok) {
            if (response.status === 404) {
                const error = new Error('Chofer no encontrado.') as Error & { status: number };
                error.status = 404;
                throw error;
            }
            throw new Error(`Error al obtener los detalles del chofer: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error en getDriverDetails para el id ${id}:`, error);
        throw error;
    }
}

/**
 * Obtiene los datos agregados para el Dashboard.
 * Los parámetros son opcionales. Si no se proveen fechas, se obtendrán datos históricos.
 */
export async function getDashboardSummary(params: { 
  startDate?: string, 
  endDate?: string, 
  type?: string[], 
  company?: string[] 
}): Promise<DashboardSummary> {
  try {
    const query = buildQueryString(params);
    const response = await fetch(`${API_URL}/dashboard/summary?${query}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
      throw new Error(`Error ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    const alarmsByTypeWithFill = data.alarmsByType.map((item: { name: string; value: number }, index: number) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
    
    return { ...data, alarmsByType: alarmsByTypeWithFill };
  } catch (error) {
    console.error("Error en getDashboardSummary:", error);
    return {
      kpis: { totalAlarms: 0, confirmationRate: "0.0", avgAlarmsPerDriver: "0.0", avgAlarmsPerDevice: "0.0" },
      alarmsByDay: [],
      alarmsByType: [],
      alarmStatusProgress: [],
      hourlyDistribution: [],
      driverRanking: [],
      topDevices: [],
    };
  }
}

/**
 * Revierte una alarma a su estado 'Pendiente'.
 */
export async function undoAlarm(alarmId: string): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/undo`, {
        method: 'PUT',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al deshacer la acción de la alarma');
    }
    return await response.json();
}

/**
 * Obtiene la lista de todos los dispositivos, con un filtro de búsqueda opcional.
 */
export async function getDispositivos(params?: { search?: string }): Promise<DeviceListItem[]> {
    try {
        const query = buildQueryString(params);
        const response = await fetch(`${API_URL}/dispositivos?${query}`);
        if (!response.ok) {
            throw new Error(`Error al obtener los dispositivos: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Hubo un problema con la operación de fetch en getDispositivos:", error);
        throw error;
    }
}

/**
 * Obtiene los detalles y estadísticas de un dispositivo específico por su ID.
 */
export async function getDispositivoDetails(id: string): Promise<DeviceDetails> {
    try {
        const response = await fetch(`${API_URL}/dispositivos/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                const error = new Error('Dispositivo no encontrado.') as Error & { status: number };
                error.status = 404;
                throw error;
            }
            throw new Error(`Error al obtener los detalles del dispositivo: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Hubo un problema con la operación de fetch en getDispositivoDetails para el id ${id}:`, error);
        throw error;
    }
}

/**
 * Obtiene todas las anomalías disponibles desde la base de datos
 */
export async function getAnomalias(): Promise<Anomaly[]> {
    try {
        const response = await fetch(`${API_URL}/anomalias`);
        if (!response.ok) {
            console.error('Response status:', response.status);
            throw new Error(`Error al obtener las anomalías: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error en getAnomalias:", error);
        return [];
    }
}

/**
 * Actualiza la descripción de una alarma confirmada
 */
export async function updateAlarmDescription(alarmId: string, description: string): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/description`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al actualizar la descripción');
    }
    return await response.json();
}

/**
 * Actualiza la anomalía asignada a una alarma confirmada
 */
export async function updateAlarmAnomaly(alarmId: string, anomalyId: number | null): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/anomaly`, {
        method: 'PATCH',
        body: JSON.stringify({ anomalyId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al actualizar la anomalía');
    }
    return await response.json();
}


