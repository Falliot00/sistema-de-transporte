// frontend/lib/api.ts
import { Alarm, Driver, GetAlarmsResponse, GetAlarmsParams, DashboardSummary } from "@/types";

const isServer = typeof window === 'undefined';

const API_URL = isServer
  ? 'http://localhost:3001/api'
  : process.env.NEXT_PUBLIC_API_URL!;
if (!API_URL) {
  throw new Error("La variable de entorno NEXT_PUBLIC_API_URL no está definida.");
}

// Helper para construir la query string
const buildQueryString = (params?: GetAlarmsParams): string => {
    if (!params) return "";
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.type && params.type.length > 0) {
      params.type.forEach(t => query.append('type', t));
    }
    if (params.company && params.company.length > 0) {
      params.company.forEach(c => query.append('company', c));
    }
    return query.toString();
}

export async function getAlarms(params?: GetAlarmsParams): Promise<GetAlarmsResponse> {
  try {
    const query = buildQueryString(params);
    const response = await fetch(`${API_URL}/alarmas?${query}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
      throw new Error(`Error al obtener los datos: ${response.status} - ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Hubo un problema con la operación de fetch en getAlarms:", error);
    return {
      alarms: [],
      pagination: { totalAlarms: 0, currentPage: 1, pageSize: 12, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      globalCounts: { total: 0, pending: 0, suspicious: 0, confirmed: 0, rejected: 0 }
    };
  }
}


export async function getAlarmsCount(params?: GetAlarmsParams): Promise<{ count: number }> {
    try {
        const query = buildQueryString(params);
        const response = await fetch(`${API_URL}/alarmas/count?${query}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
            throw new Error(`Error al obtener el conteo: ${response.status} - ${errorData.message || response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Hubo un problema con la operación de fetch en getAlarmsCount:", error);
        return { count: 0 };
    }
}


export async function reviewAlarm(alarmId: string, status: 'confirmed' | 'rejected', description?: string, choferId?: number): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, descripcion: description, choferId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al revisar la alarma');
    }
    return await response.json();
}

export async function assignDriver(alarmId: string, choferId: number | null): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/assign-driver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choferId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al asignar el chofer');
    }
    return await response.json();
}

export async function confirmAlarm(alarmId: string, description?: string, choferId?: number): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: description, choferId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al confirmar la alarma');
    }
    return await response.json();
}

export async function reEvaluateAlarm(alarmId: string, description?: string): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/re-evaluate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: description }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al re-evaluar la alarma');
    }
    return await response.json();
}

export async function retryVideo(alarmId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/retry-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al reintentar la descarga del video');
    }
    return await response.json();
}

export async function getDrivers(query?: string): Promise<Driver[]> {
    try {
        const url = new URL(`${API_URL}/choferes`);
        if (query) {
            url.searchParams.append('search', query);
        }
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Error al obtener los choferes: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Hubo un problema con la operación de fetch en getDrivers:", error);
        throw error;
    }
}

export async function getDriverDetails(id: string): Promise<Driver> {
    try {
        const response = await fetch(`${API_URL}/choferes/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                 const error = new Error('Chofer no encontrado.');
                 (error as any).status = 404;
                 throw error;
            }
            throw new Error(`Error al obtener los detalles del chofer: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Hubo un problema con la operación de fetch en getDriverDetails para el id ${id}:`, error);
        throw error;
    }
}

export async function getDashboardSummary(params: { startDate: string, endDate: string }): Promise<DashboardSummary> {
  try {
    const query = new URLSearchParams(params);
    const response = await fetch(`${API_URL}/dashboard/summary?${query.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
      throw new Error(`Error al obtener los datos del dashboard: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    const alarmsByTypeWithFill = data.alarmsByType.map((item: any, index: number) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
    
    return { ...data, alarmsByType: alarmsByTypeWithFill };

  } catch (error) {
    console.error("Hubo un problema con la operación de fetch en getDashboardSummary:", error);
    return {
      kpis: { totalAlarms: 0, confirmationRate: "0.0" },
      alarmsByDay: [],
      alarmsByType: [],
      alarmStatusProgress: [],
      hourlyDistribution: [],
      weeklyTrend: [],
      driverRanking: [],
      deviceSummary: { active: 0, maintenance: 0, offline: 0, total: 0 },
      topDevices: [],
    };
  }
}

export async function undoAlarm(alarmId: string): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/undo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al deshacer la acción de la alarma');
    }
    return await response.json();
}