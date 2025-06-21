// frontend/lib/api.ts
import { Alarm, Driver, GetAlarmsResponse, GetAlarmsParams } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("La variable de entorno NEXT_PUBLIC_API_URL no está definida.");
}

// ... getAlarms, reviewAlarm, confirmAlarm, reEvaluateAlarm sin cambios ...
export async function getAlarms(params?: GetAlarmsParams): Promise<GetAlarmsResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type.length > 0) {
      params.type.forEach(t => query.append('type', t));
    }
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const response = await fetch(`${API_URL}/alarmas?${query.toString()}`);
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

// --- INICIO DE CAMBIOS ---

export async function reviewAlarm(alarmId: string, status: 'confirmed' | 'rejected', description?: string): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, descripcion: description }), // Enviamos la descripción
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al revisar la alarma');
    }
    return await response.json();
}

export async function confirmAlarm(alarmId: string, description?: string): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: description }), // Enviamos la descripción
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
        body: JSON.stringify({ descripcion: description }), // Enviamos la descripción
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al re-evaluar la alarma');
    }
    return await response.json();
}

// --- INICIO DE LA SOLUCIÓN: Nueva función de API para reintentar video ---
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
// --- FIN DE LA SOLUCIÓN ---

// --- INICIO DE LA SOLUCIÓN: Nueva función para obtener choferes ---
export async function getChoferes(): Promise<Driver[]> {
    try {
        const response = await fetch(`${API_URL}/choferes`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
            throw new Error(`Error al obtener los choferes: ${response.status} - ${errorData.message || response.statusText}`);
        }
        const choferesFromDb = await response.json();

        // Mapeamos los datos de la DB al tipo `Driver` del frontend
        return choferesFromDb.map((chofer: any) => ({
            id: chofer.choferes_id.toString(),
            name: `${chofer.nombre} ${chofer.apellido}`,
            license: chofer.dni || 'N/A'
        }));

    } catch (error) {
        console.error("Hubo un problema con la operación de fetch en getChoferes:", error);
        return []; // Devolver un array vacío en caso de error
    }
}
// --- FIN DE LA SOLUCIÓN ---