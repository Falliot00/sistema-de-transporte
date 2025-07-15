// backend/src/utils/transformers.ts

const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

export const getEmpresaNameFromId = (idEmpresa: number | null): string => {
    if (idEmpresa === null) return 'Empresa Desconocida';
    const empresaMap: Record<number, string> = {
        1: 'Laguna Paiva',
        2: 'Monte Vera',
    };
    return empresaMap[idEmpresa] || `Empresa ID: ${idEmpresa}`;
};

const getAlarmStatusForFrontend = (dbStatus: string | null | undefined): 'pending' | 'suspicious' | 'confirmed' | 'rejected' => {
  const lowercasedStatus = dbStatus?.trim().toLowerCase();
  if (!lowercasedStatus) return 'pending';
  if (DB_QUERY_STATUS_MAP.confirmed.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'confirmed';
  if (DB_QUERY_STATUS_MAP.rejected.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'rejected';
  if (DB_QUERY_STATUS_MAP.suspicious.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'suspicious';
  return 'pending';
};

export function parseApellidoNombre(apellidoNombre: string | null | undefined): { nombre: string; apellido: string } {
  if (!apellidoNombre) {
    return { nombre: '', apellido: '' };
  }
  const parts = apellidoNombre.includes(',') 
    ? apellidoNombre.split(',').map(s => s.trim())
    : apellidoNombre.split(' ');
  const apellido = parts[0] || '';
  const nombre = parts.slice(1).join(' ').trim();
  return { apellido, nombre };
}

export const transformAlarmData = (alarm: any) => {
    const { nombre: choferNombre, apellido: choferApellido } = parseApellidoNombre(alarm.chofer?.apellido_nombre);
    
    return {
        id: alarm.guid,
        status: getAlarmStatusForFrontend(alarm.estado),
        rawStatus: alarm.estado,
        type: alarm.typeAlarm?.alarm || 'Tipo Desconocido',
        timestamp: alarm.alarmTime,
        videoProcessing: (alarm.estado === 'Sospechosa' && !alarm.video),
        speed: alarm.velocidad,
        descripcion: alarm.descripcion,
        company: alarm.Empresa || 'Empresa Desconocida',
        location: {
          latitude: parseFloat(alarm.lat || '0'),
          longitude: parseFloat(alarm.lng || '0'),
          address: alarm.ubi || 'Dirección no disponible',
        },
        driver: alarm.chofer ? {
            id: alarm.chofer.choferes_id.toString(),
            name: `${choferNombre} ${choferApellido}`.trim() || alarm.chofer.apellido_nombre || 'Sin nombre',
            license: alarm.chofer.dni || 'DNI no disponible',
            company: getEmpresaNameFromId(alarm.chofer.idEmpresa),
        } : null,
        vehicle: { 
          id: `vehiculo-${alarm.dispositivo || 'sin-dispositivo'}`,
          // Usamos la relación 'deviceInfo' para obtener la patente
          licensePlate: alarm.deviceInfo?.patente || 'Patente no disp.',
          model: 'Modelo pendiente',
          interno: alarm.interno || 'N/A',
          company: alarm.Empresa || 'Empresa Desconocida',
        },
        device: alarm.deviceInfo ? { 
            id: `disp-${alarm.deviceInfo.idDispositivo}`, 
            name: `Dispositivo ${alarm.deviceInfo.idDispositivo}`, 
            serialNumber: alarm.deviceInfo.idDispositivo 
        } : null,
        media: [
          ...(alarm.imagen ? [{ id: 'img1', type: 'image' as const, url: alarm.imagen }] : []),
          ...(alarm.video ? [{ id: 'vid1', type: 'video' as const, url: alarm.video }] : []),
        ],
        comments: [],
    };
};