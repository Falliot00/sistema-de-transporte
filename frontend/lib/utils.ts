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
  | 'brown' | 'deepBlue' | 'deepViolet' | 'darkRed' | 'orangeBlack' | 'muted'
  | 'lensBrown' | 'headPink' | 'fatigueViolet' | 'cellphoneRed' | 'smokeGray' | 'distractionBlue';

const FALLBACK_TYPE_VARIANTS: AlarmTypeVariant[] = [
  'sky', 'emerald', 'amber', 'purple', 'tealDark', 'rose'
];

const ALARM_TYPE_VARIANT_BY_ID: Record<number, AlarmTypeVariant> = {
  403: 'lensBrown',
  453: 'lensBrown',
  603: 'lensBrown',
  653: 'lensBrown',
  460: 'headPink',
  618: 'fatigueViolet',
  619: 'fatigueViolet',
  620: 'cellphoneRed',
  622: 'smokeGray',
  624: 'distractionBlue',
  626: 'distractionBlue',
};

const normalizeAlarmType = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const SPECIFIC_TYPE_COLORS_BY_NAME: Record<string, AlarmTypeVariant> = {
  'desviacion de lente1': 'lensBrown',
  'desviacion de la lente2': 'lensBrown',
  'cabeza baja': 'headPink',
  'deteccion de fatiga1': 'fatigueViolet',
  'deteccion de fatiga2': 'fatigueViolet',
  'deteccion de fatiga': 'fatigueViolet',
  'uso de celular': 'cellphoneRed',
  'fumar': 'smokeGray',
  'distraccion del conductor1': 'distractionBlue',
  'distraccion del conductor2': 'distractionBlue',
  'distraccion del conductor': 'distractionBlue',
};

export function getColorVariantForType(type: string, typeId?: number | null): AlarmTypeVariant {
  if (typeof typeId === 'number' && typeId in ALARM_TYPE_VARIANT_BY_ID) {
    return ALARM_TYPE_VARIANT_BY_ID[typeId];
  }

  const normalizedType = normalizeAlarmType(type || '');
  if (normalizedType in SPECIFIC_TYPE_COLORS_BY_NAME) {
    return SPECIFIC_TYPE_COLORS_BY_NAME[normalizedType];
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

const toLocalDayBoundary = (date: Date, boundary: 'start' | 'end'): Date => {
  const normalized = new Date(date);
  if (boundary === 'start') {
    normalized.setHours(0, 0, 0, 0);
  } else {
    normalized.setHours(23, 59, 59, 999);
  }
  return normalized;
};

const toUtcPreservingLocalTime = (date: Date): string => {
  const offsetMinutes = date.getTimezoneOffset();
  const utcTimestamp = new Date(date.getTime() - offsetMinutes * 60 * 1000);
  return utcTimestamp.toISOString();
};

export const getApiDateRange = (dateRange?: { from?: Date; to?: Date }) => {
  if (!dateRange) {
    return { startDate: undefined, endDate: undefined };
  }

  const effectiveEndDate = dateRange.to ?? dateRange.from;

  const startDate = dateRange.from
    ? toUtcPreservingLocalTime(toLocalDayBoundary(dateRange.from, 'start'))
    : undefined;

  const endDate = effectiveEndDate
    ? toUtcPreservingLocalTime(toLocalDayBoundary(effectiveEndDate, 'end'))
    : undefined;

  return { startDate, endDate };
};
