// backend/src/utils/transformers.ts

const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

const getAlarmStatusForFrontend = (dbStatus: string | null | undefined): 'pending' | 'suspicious' | 'confirmed' | 'rejected' => {
  const lowercasedStatus = dbStatus?.trim().toLowerCase();
  if (!lowercasedStatus) return 'pending';
  if (DB_QUERY_STATUS_MAP.confirmed.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'confirmed';
  if (DB_QUERY_STATUS_MAP.rejected.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'rejected';
  if (DB_QUERY_STATUS_MAP.suspicious.map(s => s.toLowerCase()).includes(lowercasedStatus)) return 'suspicious';
  return 'pending';
};

function parseApellidoNombre(apellidoNombre: string | null | undefined): { nombre: string; apellido: string } {
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

function getEmpresaName(idEmpresa: number | null | undefined): string {
  if (!idEmpresa) return 'Empresa Desconocida';
  const empresaMap: Record<number, string> = {
    1: 'Empresa A',
    2: 'Empresa B',
  };
  return empresaMap[idEmpresa] || `Empresa ${idEmpresa}`;
}

export const transformAlarmData = (alarm: any) => {
    // CORRECCIÓN: La relación se llama 'chofer' y el campo es 'apellido_nombre'
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
            company: getEmpresaName(alarm.chofer.idEmpresa),
        } : null,
        vehicle: { 
          id: `vehiculo-${alarm.dispositivo || 'sin-dispositivo'}`, 
          licensePlate: alarm.patente || 'Patente no disponible', // 'patente' no está en el schema, será undefined
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
    };
};