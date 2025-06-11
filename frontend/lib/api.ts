// frontend/lib/api.ts

import { Alarm } from "@/types";

// Aseguramos que la URL de la API esté definida en las variables de entorno.
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("La variable de entorno NEXT_PUBLIC_API_URL no está definida.");
}

/**
 * Obtiene todas las alarmas desde el backend.
 * @returns Una promesa que se resuelve en un array de Alarmas.
 */
export async function getAlarms(): Promise<Alarm[]> {
  try {
    const response = await fetch(`${API_URL}/alarmas`);
    if (!response.ok) {
      throw new Error(`Error al obtener los datos: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Hubo un problema con la operación de fetch:", error);
    return []; // Devolver un array vacío para no romper la UI en caso de error.
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
        throw new Error('Error al actualizar la alarma');
    }
    return await response.json();
}