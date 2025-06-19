// frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Alarm } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ALARM_STATUS_KEYS = {
  PENDING: 'pending',
  SUSPICIOUS: 'suspicious',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const;

export const ALARM_STATUS_ES: { [key: string]: string } = {
  [ALARM_STATUS_KEYS.PENDING]: 'Pendiente',
  [ALARM_STATUS_KEYS.SUSPICIOUS]: 'Sospechosa',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'Confirmada',
  [ALARM_STATUS_KEYS.REJECTED]: 'Rechazada',
};

export const ALARM_STATUS_ES_PLURAL: { [key: string]: string } = {
  [ALARM_STATUS_KEYS.PENDING]: 'Pendientes',
  [ALARM_STATUS_KEYS.SUSPICIOUS]: 'Sospechosas',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'Confirmadas',
  [ALARM_STATUS_KEYS.REJECTED]: 'Rechazadas',
};

export const ALARM_STATUS_VARIANT: { [key: string]: "warning" | "info" | "success" | "destructive" } = {
  [ALARM_STATUS_KEYS.PENDING]: 'warning',
  [ALARM_STATUS_KEYS.SUSPICIOUS]: 'info',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'success',
  [ALARM_STATUS_KEYS.REJECTED]: 'destructive',
};

export const ALARM_STATUS_BORDER_COLORS: { [key: string]: string } = {
  [ALARM_STATUS_KEYS.PENDING]: 'border-l-yellow-400',
  [ALARM_STATUS_KEYS.SUSPICIOUS]: 'border-l-blue-500',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'border-l-green-500',
  [ALARM_STATUS_KEYS.REJECTED]: 'border-l-red-500',
};

export function getAlarmStatusInfo(status: Alarm['status']) {
  return {
    label: ALARM_STATUS_ES[status] || 'Desconocido',
    variant: ALARM_STATUS_VARIANT[status] || 'warning',
    border: ALARM_STATUS_BORDER_COLORS[status] || 'border-l-gray-400'
  };
}

export type AlarmTypeVariant = 
  | 'sky' | 'emerald' | 'amber' 
  | 'purple' | 'tealDark' | 'rose'
  | 'brown' | 'deepBlue' | 'deepViolet' | 'darkRed' | 'orangeBlack' | 'muted';


const FALLBACK_TYPE_VARIANTS: AlarmTypeVariant[] = [
  'sky', 'emerald', 'amber', 'purple', 'tealDark', 'rose'
];

const SPECIFIC_TYPE_COLORS: { [key: string]: AlarmTypeVariant } = {
  'Sin cinturón': 'deepBlue',
  'Detección de fatiga': 'deepViolet',
  'Distracción del conductor': 'brown',
  'Comportamiento anormal': 'orangeBlack',
  'Cabeza baja': 'rose',
};

export function getColorVariantForType(type: string): AlarmTypeVariant {
  if (type in SPECIFIC_TYPE_COLORS) {
    return SPECIFIC_TYPE_COLORS[type];
  }

  if (!type) return 'sky';
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_TYPE_VARIANTS.length;
  return FALLBACK_TYPE_VARIANTS[index];
}

/**
 * Corrige y formatea un timestamp de alarma.
 * La API devuelve un string de fecha/hora en formato ISO UTC (terminado en 'Z'),
 * pero el valor numérico corresponde a la hora local de Argentina (ART).
 * Esta función elimina la 'Z' para que el navegador interprete la fecha en su zona horaria local,
 * evitando así una conversión incorrecta desde UTC.
 * @param dateString - El string de timestamp de la alarma, ej: "2024-06-19T15:30:00.000Z"
 * @param options - Opciones de formato para toLocaleString.
 * @returns La fecha y hora formateada.
 */
export function formatCorrectedTimestamp(
  dateString?: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return "No disponible";

  // Si el string termina en 'Z' (indicador de UTC), lo eliminamos.
  const localDateString = dateString.endsWith('Z') ? dateString.slice(0, -1) : dateString;
  
  const date = new Date(localDateString);
  
  if (isNaN(date.getTime())) {
    return "Fecha inválida";
  }
  
  return date.toLocaleString('es-AR', options);
}