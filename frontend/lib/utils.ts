// frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Alarm } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- INICIO DE LA SOLUCIÓN ---
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

// Se añade un nuevo color para 'suspicious'
export const ALARM_STATUS_VARIANT: { [key: string]: "warning" | "info" | "success" | "destructive" } = {
  [ALARM_STATUS_KEYS.PENDING]: 'warning',
  [ALARM_STATUS_KEYS.SUSPICIOUS]: 'info',
  [ALARM_STATUS_KEYS.CONFIRMED]: 'success',
  [ALARM_STATUS_KEYS.REJECTED]: 'destructive',
};

export const ALARM_STATUS_BORDER_COLORS: { [key: string]: string } = {
  [ALARM_STATUS_KEYS.PENDING]: 'border-l-yellow-400',
  [ALARM_STATUS_KEYS.SUSPICIOUS]: 'border-l-blue-500', // Color azul para sospechosas
  [ALARM_STATUS_KEYS.CONFIRMED]: 'border-l-green-500',
  [ALARM_STATUS_KEYS.REJECTED]: 'border-l-red-500',
};

// La función ahora devuelve la info correcta para cada estado.
export function getAlarmStatusInfo(status: Alarm['status']) {
  return {
    label: ALARM_STATUS_ES[status] || 'Desconocido',
    variant: ALARM_STATUS_VARIANT[status] || 'warning',
    border: ALARM_STATUS_BORDER_COLORS[status] || 'border-l-gray-400'
  };
}

// Se añade un nuevo color a los badges en badge.tsx
// (Este cambio se haría en `components/ui/badge.tsx` pero lo menciono aquí para completitud)
// variants: { ... variant: { ..., info: "border-transparent bg-blue-500 text-primary-foreground hover:bg-blue-500/80" } }
// --- FIN DE LA SOLUCIÓN ---

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

