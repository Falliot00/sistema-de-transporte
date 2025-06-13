import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Alarm } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 1. Definimos las claves de estado para seguridad y consistencia.
export const ALARM_STATUS_KEYS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const;

// 2. Mapeo para etiquetas en español (singular).
export const ALARM_STATUS_ES: { [key in Alarm['status']]: string } = {
  [ALARM_STATUS_KEYS.PENDING]: 'Pendiente',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'Sospechosa',
  [ALARM_STATUS_KEYS.REJECTED]: 'Rechazado',
};

// 3. Mapeo para etiquetas en español (plural).
export const ALARM_STATUS_ES_PLURAL: { [key in Alarm['status']]: string } = {
  [ALARM_STATUS_KEYS.PENDING]: 'Pendientes',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'Sospechosas',
  [ALARM_STATUS_KEYS.REJECTED]: 'Rechazados',
};

// 4. Mapeo para las variantes de color de los Badges de estado.
export const ALARM_STATUS_VARIANT: { [key in Alarm['status']]: "warning" | "success" | "destructive" } = {
  [ALARM_STATUS_KEYS.PENDING]: 'warning',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'success',
  [ALARM_STATUS_KEYS.REJECTED]: 'destructive',
};

// 5. Mapeo para los colores de borde de las tarjetas.
export const ALARM_STATUS_BORDER_COLORS: { [key in Alarm['status']]: string } = {
  [ALARM_STATUS_KEYS.PENDING]: 'border-l-yellow-400',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'border-l-green-500',
  [ALARM_STATUS_KEYS.REJECTED]: 'border-l-red-500',
};

// 6. Función de ayuda principal - CORREGIDA para que SIEMPRE devuelva un objeto.
export function getAlarmStatusInfo(status: Alarm['status']) {
  return {
    label: ALARM_STATUS_ES[status] || 'Desconocido',
    variant: ALARM_STATUS_VARIANT[status] || 'warning', // Valor por defecto seguro
  };
}

// 7. Lógica para asignar colores a los tipos de alarma.
export type AlarmTypeVariant = 
  | 'sky' | 'emerald' | 'amber' 
  | 'purple' | 'tealDark' | 'rose'
  | 'brown' | 'deepBlue' | 'deepViolet' | 'darkRed' | 'orangeBlack' | 'muted';


const FALLBACK_TYPE_VARIANTS: AlarmTypeVariant[] = [
  'sky', 'emerald', 'amber', 'purple', 'tealDark', 'rose'
];

// Mapeo de colores específicos con los NOMBRES CORRECTOS de la base de datos.
const SPECIFIC_TYPE_COLORS: { [key: string]: AlarmTypeVariant } = {
  'Sin cinturón': 'deepBlue',
  'Detección de fatiga': 'deepViolet',
  'Distracción del conductor': 'brown',
  'Comportamiento anormal': 'orangeBlack',
  'Cabeza baja': 'rose',
  // Puedes añadir más tipos de alarma aquí con su color asignado
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

