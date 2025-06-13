// frontend/lib/api.ts
import { Alarm } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("La variable de entorno NEXT_PUBLIC_API_URL no está definida.");
}

// --- NUEVOS TIPOS PARA LA RESPUESTA PAGINADA ---
export interface PaginationInfo {
  page: number;
  limit: number;
  totalAlarms: number;
  totalPages: number;
}

export interface PaginatedAlarmsResponse {
  alarms: Alarm[];
  pagination: PaginationInfo;
}

// --- NUEVOS PARÁMETROS PARA LA FUNCIÓN ---
export interface GetAlarmsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

/**
 * Obtiene una lista paginada y filtrada de alarmas desde el backend.
 * @param params - Objeto con los parámetros de paginación y filtrado.
 * @returns Una promesa que se resuelve en un objeto con las alarmas y la información de paginación.
 */
export async function getAlarms(params: GetAlarmsParams = {}): Promise<PaginatedAlarmsResponse> {
  const { page = 1, limit = 20, status, search } = params;
  
  // Construimos la URL con los parámetros de consulta.
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (status && status !== 'all') {
    query.append('status', status);
  }

  if (search) {
    query.append('search', search);
  }

  try {
    const response = await fetch(`${API_URL}/alarmas?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Error al obtener los datos: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Hubo un problema con la operación de fetch:", error);
    // Devolver una respuesta vacía para no romper la UI en caso de error.
    return {
      alarms: [],
      pagination: {
        page: 1,
        limit: 20,
        totalAlarms: 0,
        totalPages: 0,
      },
    };
  }
}

/**
 * Actualiza el estado de una alarma (la "revisa").
 * @param alarmId - El GUID de la alarma a actualizar.
 * @param status - El nuevo estado ('confirmed' o 'rejected').
 * @returns La alarma con su estado actualizado.
 */
export async function reviewAlarm(alarmId: string, status: 'confirmed' | 'rejected'): Promise<Alarm> {
    const response = await fetch(`${API_URL}/alarmas/${alarmId}/review`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || 'Error al actualizar la alarma');
    }
    return await response.json();
}

/**
 * Obtiene un lote (página) de alarmas pendientes para el MODO ANÁLISIS.
 * Esta función se mantiene sin cambios para el flujo de análisis rápido.
 * @param page - El número de página a solicitar.
 * @param limit - La cantidad de alarmas por página (lote).
 * @returns Un objeto con las alarmas y la información de paginación para el modo análisis.
 */
export async function getPendingAlarmsForAnalysis(page: number = 1, limit: number = 10) {
  try {
    const response = await fetch(`${API_URL}/alarmas/pending?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Error al obtener las alarmas pendientes: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Hubo un problema con la operación de fetch para alarmas pendientes:", error);
    return {
      alarms: [],
      total: 0,
      page: 1,
      limit: 10,
      hasNextPage: false,
    };
  }
}