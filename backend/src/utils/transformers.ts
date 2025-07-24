// backend/src/utils/transformers.ts

import { getAlarmStatusForFrontend } from './statusHelpers'; // Moveremos la lógica de status a su propio archivo para mayor claridad

/**
 * Mapea el ID de empresa a un nombre legible.
 * Esta función se mantiene por si se necesita para datos que no provienen de una relación directa,
 * como en el modelo de Choferes si no se incluye la relación con Empresa en la consulta.
 * @param idEmpresa El ID numérico de la empresa.
 * @returns El nombre de la empresa o un texto por defecto.
 */
export const getEmpresaNameFromId = (idEmpresa: number | null | undefined): string => {
    if (idEmpresa === null || idEmpresa === undefined) {
        return 'Empresa Desconocida';
    }
    const empresaMap: Record<number, string> = {
        1: 'Laguna Paiva',
        2: 'Monte Vera',
    };
    return empresaMap[idEmpresa] || `Empresa ID: ${idEmpresa}`;
};

/**
 * Transforma un objeto de alarma de la base de datos, con sus relaciones de Prisma,
 * al formato que espera el frontend (DTO - Data Transfer Object).
 * @param alarm - El objeto de alarma obtenido de una consulta de Prisma con `include`.
 * @returns Un objeto Alarm formateado para el cliente.
 */
export const transformAlarmData = (alarm: any) => {
    // El objeto 'alarm' ahora viene con 'chofer', 'empresaInfo', 'anomaliaInfo', etc., populados por Prisma.
    
    return {
        id: alarm.guid,
        status: getAlarmStatusForFrontend(alarm.estado),
        rawStatus: alarm.estado,
        type: alarm.typeAlarm?.alarm || 'Tipo Desconocido',
        timestamp: alarm.alarmTime,
        videoProcessing: (alarm.estado === 'Sospechosa' && !alarm.video),
        speed: alarm.velocidad,
        descripcion: alarm.descripcion,
        // --- CAMBIO: Usamos la relación `empresaInfo` para obtener el nombre de la empresa.
        // Usamos `nombreMin` que parece ser el formato deseado para mostrar.
        // Como fallback, mantenemos el campo de texto original por si la relación no viene.
        company: alarm.empresaInfo?.nombreMin || 'Empresa Desconocida',
        location: {
          latitude: parseFloat(alarm.lat || '0'),
          longitude: parseFloat(alarm.lng || '0'),
          address: alarm.ubi || 'Dirección no disponible',
        },
        driver: alarm.chofer ? {
            id: alarm.chofer.choferes_id.toString(),
            // --- CAMBIO: Usamos el campo `apellido_nombre` directamente. ---
            apellido_nombre: alarm.chofer.apellido_nombre || 'Sin Nombre Asignado',
            license: alarm.chofer.dni || 'DNI no disponible',
            // --- MEJORA: Obtenemos la empresa del chofer desde su propia relación. ---
            // Esto asume que en la consulta del chofer se incluye `empresaInfo`.
            // Si no, podemos usar la función de mapeo como fallback.
            company: alarm.chofer.empresaInfo?.nombreMin || getEmpresaNameFromId(alarm.chofer.idEmpresa),
        } : null,
        vehicle: { 
          id: `vehiculo-${alarm.dispositivo || 'sin-dispositivo'}`,
          licensePlate: alarm.deviceInfo?.patente || 'Patente no disp.',
          model: 'Modelo pendiente',
          interno: alarm.interno?.toString() || 'N/A',
          // --- CAMBIO: La empresa del vehículo es la misma que la de la alarma. ---
          company: alarm.empresaInfo?.nombreMin || 'Empresa Desconocida',
        },
        device: alarm.deviceInfo ? { 
            id: `disp-${alarm.deviceInfo.idDispositivo}`, 
            name: `Dispositivo ${alarm.deviceInfo.idDispositivo}`, 
            serialNumber: alarm.deviceInfo.idDispositivo.toString() 
        } : null,
        media: [
          ...(alarm.imagen ? [{ id: 'img1', type: 'image' as const, url: alarm.imagen }] : []),
          ...(alarm.video ? [{ id: 'vid1', type: 'video' as const, url: alarm.video }] : []),
        ],
        // --- NUEVO: Añadimos la información de la anomalía al objeto transformado. ---
        anomalia: alarm.anomaliaInfo ? {
            idAnomalia: alarm.anomaliaInfo.idAnomalia,
            nomAnomalia: alarm.anomaliaInfo.nomAnomalia,
            descAnomalia: alarm.anomaliaInfo.descAnomalia
        } : null,
        comments: [],
    };
};