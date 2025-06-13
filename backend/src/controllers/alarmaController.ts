// backend/src/controllers/alarmaController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- INICIO DE LA SOLUCIÓN REFINADA PARA ESTADOS ---

// Mapeo de los estados internos de la aplicación (frontend, lógica)
// a TODOS los valores posibles que pueden aparecer en la columna 'estado' de la base de datos.
const DB_QUERY_STATUS_MAP: Record<'pending' | 'confirmed' | 'rejected', string[]> = {
  pending: ['Pendiente', 'Sospechosa'], // Mapea 'Pendiente' y 'Sospechosa' a nuestro 'pending' interno
  confirmed: ['Confirmada', 'confirmed'], // Mapea 'Confirmada' y 'confirmed' a nuestro 'confirmed' interno
  rejected: ['Rechazada', 'rejected'],   // Mapea 'Rechazada' y 'rejected' a nuestro 'rejected' interno
};

// Función para transformar el estado leído de la DB a nuestro formato interno normalizado (lowercase English).
// Esta función ahora es más flexible para manejar todas las variantes conocidas.
const getAlarmStatus = (dbStatus: string | null | undefined): 'pending' | 'confirmed' | 'rejected' => {
  const lowercasedStatus = dbStatus?.trim().toLowerCase();

  if (!lowercasedStatus) return 'pending'; // Por defecto para null/undefined/vacío

  // Verificamos si el estado se mapea a 'confirmed'
  if (DB_QUERY_STATUS_MAP.confirmed.map(s => s.toLowerCase()).includes(lowercasedStatus)) {
    return 'confirmed';
  }
  // Verificamos si el estado se mapea a 'rejected'
  if (DB_QUERY_STATUS_MAP.rejected.map(s => s.toLowerCase()).includes(lowercasedStatus)) {
    return 'rejected';
  }
  // Si no es explícitamente confirmado o rechazado (en cualquiera de sus formas),
  // se considera pendiente. Esto cubre 'Pendiente', 'Sospechosa' y cualquier otro valor no previsto.
  return 'pending';
};

const transformAlarmData = (alarm: any) => {
  return {
    id: alarm.guid,
    status: getAlarmStatus(alarm.estado), // Aquí usamos la función para normalizar el estado al salir de la DB
    type: alarm.typeAlarm ? alarm.typeAlarm.alarm : 'Tipo Desconocido',
    timestamp: alarm.alarmTime,
    location: {
      latitude: parseFloat(alarm.lat) || 0,
      longitude: parseFloat(alarm.lng) || 0,
      address: alarm.ubi || 'Dirección no disponible',
    },
    driver: {
      id: `chofer-${alarm.interno}`,
      name: `Chofer ${alarm.interno || 'Desconocido'}`,
      license: 'Licencia pendiente',
    },
    vehicle: {
      id: `vehiculo-${alarm.patente}`,
      licensePlate: alarm.patente || 'Patente desconocida',
      model: 'Modelo pendiente',
    },
    device: {
      id: `disp-${alarm.dispositivo}`,
      name: `Dispositivo ${alarm.dispositivo || 'Desconocido'}`,
      serialNumber: alarm.dispositivo || 'N/A',
    },
    media: [
      ...(alarm.imagen ? [{ id: 'img1', type: 'image', url: alarm.imagen }] : []),
      ...(alarm.video ? [{ id: 'vid1', type: 'video', url: alarm.video }] : []),
    ],
    comments: [],
  };
};

// --- FIN DE LA SOLUCIÓN REFINADA PARA ESTADOS ---


export const getAllAlarms = async (req: Request, res: Response) => {
  // Parámetros de paginación y filtros
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12; // Ajusta el tamaño de página por defecto si es necesario
  const statusFilter = req.query.status as string;
  const search = req.query.search as string;

  const skip = (page - 1) * pageSize;

  let whereClause: any = {};

  // Modificación clave: Usamos el mapeo a un array de posibles valores de DB con 'in'
  if (statusFilter && statusFilter !== 'all') {
    whereClause.estado = {
        in: DB_QUERY_STATUS_MAP[statusFilter as keyof typeof DB_QUERY_STATUS_MAP]
    };
  }

  if (search) {
    whereClause.OR = [
      { patente: { contains: search, mode: 'insensitive' } },
      { interno: { contains: search, mode: 'insensitive' } },
      { typeAlarm: { alarm: { contains: search, mode: 'insensitive' } } },
    ];
  }

  try {
    // Obtener las alarmas para la página actual con los filtros aplicados
    const alarmsFromDb = await prisma.alarmasHistorico.findMany({
      skip: skip,
      take: pageSize,
      orderBy: { alarmTime: 'desc' },
      where: whereClause,
      include: {
        typeAlarm: true, 
      },
    });

    const transformedAlarms = alarmsFromDb.map(transformAlarmData);

    // Obtener el total de alarmas que coinciden con los filtros (sin paginación)
    const totalAlarmsFiltered = await prisma.alarmasHistorico.count({
      where: whereClause, // Este total es el de la vista actual (filtrada)
    });

    // Obtener los conteos globales de todos los estados, usando el mapeo a TODOS los valores de la DB
    const totalConfirmedGlobal = await prisma.alarmasHistorico.count({
      where: { estado: { in: DB_QUERY_STATUS_MAP.confirmed } }, // Usar 'in' para ambos 'Confirmada' y 'confirmed'
    });
    const totalRejectedGlobal = await prisma.alarmasHistorico.count({
      where: { estado: { in: DB_QUERY_STATUS_MAP.rejected } },   // Usar 'in' para ambos 'Rechazada' y 'rejected'
    });
    const totalPendingGlobal = await prisma.alarmasHistorico.count({
      where: { estado: { in: DB_QUERY_STATUS_MAP.pending } },     // Usar 'in' para 'Pendiente' y 'Sospechosa'
    });
    const totalAllAlarmsGlobal = await prisma.alarmasHistorico.count(); // Conteo total de todas las alarmas en la DB

    res.status(200).json({
      alarms: transformedAlarms,
      pagination: {
        totalAlarms: totalAlarmsFiltered, // Este es el total para la paginación actual
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(totalAlarmsFiltered / pageSize),
        hasNextPage: (page * pageSize) < totalAlarmsFiltered,
        hasPrevPage: page > 1,
      },
      // Campos para los conteos globales que se mostrarán en los KPI cards
      globalCounts: {
        total: totalAllAlarmsGlobal,
        pending: totalPendingGlobal,
        confirmed: totalConfirmedGlobal,
        rejected: totalRejectedGlobal,
      },
    });
  } catch (error) {
    console.error("Error al obtener alarmas:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getAlarmById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarmFromDb = await prisma.alarmasHistorico.findUnique({
            where: { guid: id },
            include: { typeAlarm: true },
        });
        if (!alarmFromDb) {
            return res.status(404).json({ message: 'Alarma no encontrada.' });
        }
        const transformedAlarm = transformAlarmData(alarmFromDb);
        res.status(200).json(transformedAlarm);
    } catch (error) {
        console.error(`Error al obtener la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const reviewAlarm = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // status aquí viene como 'confirmed' o 'rejected' desde el frontend

  if (!status || !['confirmed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'El estado proporcionado no es válido.' });
  }

  try {
    // FIX para TS7053: Aseguramos que 'status' es una clave válida para el mapeo.
    // Usamos 'keyof typeof DB_QUERY_STATUS_MAP' para ser explícitos.
    const statusToSave = DB_QUERY_STATUS_MAP[status as keyof typeof DB_QUERY_STATUS_MAP][0]; 

    const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
      where: { guid: id },
      data: { estado: statusToSave },
      include: { typeAlarm: true }
    });
    
    const transformedAlarm = transformAlarmData(updatedAlarmFromDb);
    res.status(200).json(transformedAlarm);
  } catch (error: any) {
    if (error.code === 'P2025') {
        return res.status(404).json({ message: 'La alarma que intentas actualizar no existe.' });
    }
    console.error(`Error al actualizar la alarma ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};