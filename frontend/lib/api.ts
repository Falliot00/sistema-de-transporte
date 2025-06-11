// frontend/lib/api.ts

import { Alarm } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable.");
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
    return []; // Devuelve un array vacío en caso de error para no romper la UI.
  }
}

/**
 * Actualiza el estado de una alarma.
 * @param alarmId - El GUID de la alarma.
 * @param status - El nuevo estado ('confirmed' o 'rejected').
 * @returns La alarma actualizada.
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