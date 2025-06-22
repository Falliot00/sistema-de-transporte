// backend/src/utils/transformers.ts

// Mapeo de estados de la DB a los del frontend
const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

// Función para convertir el estado de la DB al estado del frontend
const getAlarmStatusForFrontend = (dbStatus: string | null | undefined): 'pending' | 'suspicious' | 'confirmed' | 'rejected' => {
  const lowercasedStatus = dbStatus?.trim().toLowerCase();
  if (!lowercasedStatus) return 'pending';
  if (DB_QUERY_STATUS_MAP.confirmed.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'confirmed';
  if (DB_QUERY_STATUS_MAP.rejected.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'rejected';
  if (DB_QUERY_STATUS_MAP.suspicious.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'suspicious';
  return 'pending';
};

/**
 * Transforma un objeto de alarma de la base de datos (con sus relaciones incluidas)
 * al formato esperado por el frontend.
 * @param alarm - El objeto de alarma de Prisma, incluyendo `chofer` y `typeAlarm`.
 * @returns El objeto de alarma transformado para la API.
 */
export const transformAlarmData = (alarm: any) => ({
    id: alarm.guid,
    status: getAlarmStatusForFrontend(alarm.estado),
    rawStatus: alarm.estado,
    type: alarm.typeAlarm?.alarm || 'Tipo Desconocido',
    timestamp: alarm.alarmTime,
    videoProcessing: (alarm.estado === 'Sospechosa' && !alarm.video),
    // FIX: Se añade el campo `speed` que faltaba. Se mapea desde `alarm.velocidad` de la DB.
    speed: alarm.velocidad,
    descripcion: alarm.descripcion,
    company: alarm.Empresa || 'Empresa Desconocida',
    location: {
      latitude: parseFloat(alarm.lat) || 0,
      longitude: parseFloat(alarm.lng) || 0,
      address: alarm.ubi || 'Dirección no disponible',
    },
    driver: alarm.chofer ? {
        id: alarm.chofer.choferes_id.toString(),
        name: `${alarm.chofer.nombre} ${alarm.chofer.apellido}`,
        license: alarm.chofer.dni || 'DNI no disponible',
        company: alarm.chofer.empresa || 'Empresa Desconocida',
    } : {
        id: 'chofer-no-asignado',
        name: 'Chofer No Asignado',
        license: '-',
        company: alarm.Empresa || 'Empresa Desconocida',
    },
    vehicle: { 
      id: `vehiculo-${alarm.patente}`, 
      licensePlate: alarm.patente || 'Patente desconocida', 
      model: 'Modelo pendiente',
      interno: alarm.interno || 'N/A',
      company: alarm.Empresa || 'Empresa Desconocida',
    },
    device: { id: `disp-${alarm.dispositivo}`, name: `Dispositivo ${alarm.dispositivo || 'Desconocido'}`, serialNumber: alarm.dispositivo || 'N/A' },
    media: [
      ...(alarm.imagen ? [{ id: 'img1', type: 'image' as const, url: alarm.imagen }] : []),
      ...(alarm.video ? [{ id: 'vid1', type: 'video' as const, url: alarm.video }] : []),
    ],
    comments: [],
});