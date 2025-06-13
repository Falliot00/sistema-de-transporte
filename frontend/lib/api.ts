// frontend/lib/api.ts

import { Alarm, GetAlarmsResponse, GetAlarmsParams, PaginationInfo } from "@/types";

// Aseguramos que la URL de la API esté definida en las variables de entorno.
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("La variable de entorno NEXT_PUBLIC_API_URL no está definida.");
}

/**
 * Obtiene alarmas desde el backend con paginación y filtros.
 * @param params - Objeto con parámetros de paginación y filtros.
 * @returns Una promesa que se resuelve en un objeto GetAlarmsResponse.
 */
export async function getAlarms(params?: GetAlarmsParams): Promise<GetAlarmsResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    
    // AÑADIDO: Lógica para enviar múltiples filtros de tipo
    if (params?.type && params.type.length > 0) {
      params.type.forEach(t => query.append('type', t));
    }

    const response = await fetch(`${API_URL}/alarmas?${query.toString()}`);
    if (!response.ok) {
      // Mejorar el mensaje de error si la respuesta no es OK
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
      throw new Error(`Error al obtener los datos: ${response.status} - ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Hubo un problema con la operación de fetch en getAlarms:", error);
    // Devolver una estructura de respuesta por defecto para evitar errores en la UI.
    // También asegúrate de que GlobalAlarmCounts tenga los valores por defecto.
    return {
      alarms: [],
      pagination: {
        totalAlarms: 0,
        currentPage: 1,
        pageSize: 12,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      globalCounts: {
        total: 0,
        pending: 0,
        confirmed: 0,
        rejected: 0,
      }
    };
  }
}

/**
 * Función para obtener solo las alarmas pendientes para el modo de análisis.
 * Esta función es temporalmente independiente de `getAlarms` para mantener la lógica existente de análisis.
 * Considerar consolidar si la lógica de análisis se integra más con la paginación general.
 * @param page - Número de página.
 * @param pageSize - Tamaño de la página.
 * @returns Un objeto con alarmas pendientes, total y si hay más páginas.
 */
export async function getPendingAlarmsForAnalysis(page: number = 1, pageSize: number = 10): Promise<{ alarms: Alarm[]; total: number; hasNextPage: boolean }> {
  try {
    const response = await fetch(`${API_URL}/alarmas?page=${page}&pageSize=${pageSize}&status=pending`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
      throw new Error(`Error al obtener alarmas pendientes para análisis: ${response.status} - ${errorData.message || response.statusText}`);
    }
    const data: GetAlarmsResponse = await response.json(); // Esperamos la misma estructura GetAlarmsResponse
    return {
      alarms: data.alarms,
      total: data.globalCounts.pending, // Usamos el conteo global de pendientes
      hasNextPage: data.pagination.hasNextPage, // Usamos la paginación para saber si hay más
    };
  } catch (error) {
    console.error("Hubo un problema con la operación de fetch en getPendingAlarmsForAnalysis:", error);
    return { alarms: [], total: 0, hasNextPage: false };
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
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || 'Error al actualizar la alarma');
    }
    return await response.json();
}