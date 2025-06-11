import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// Se instancia el cliente de Prisma para interactuar con la base de datos.
const prisma = new PrismaClient();

/**
 * Transforma el objeto plano de la base de datos (alarmasHistorico) a la
 * estructura anidada que espera el frontend (según frontend/types/index.ts).
 * @param {any} alarm - El objeto de alarma directamente desde la base de datos.
 * @returns {object} El objeto de alarma transformado.
 */
const transformAlarmData = (alarm: any) => {
  // Asegurarse de que lat y lng son números flotantes válidos.
  const latitude = alarm.lat ? parseFloat(alarm.lat) : 0;
  const longitude = alarm.lng ? parseFloat(alarm.lng) : 0;

  return {
    id: alarm.guid,
    status: alarm.estado || 'pending', // Si el estado es nulo, se asume 'pending'.
    type: alarm.alarmType, // Idealmente, esto se mapearía a un texto (ej. 1: 'Exceso de Velocidad').
    timestamp: alarm.alarmTime,
    location: {
      latitude: isNaN(latitude) ? 0 : latitude,
      longitude: isNaN(longitude) ? 0 : longitude,
      address: alarm.ubi || 'Dirección no disponible',
    },
    // La información del conductor y vehículo no está en la tabla `alarmasHistorico`.
    // Se llena con datos de ejemplo o se deja pendiente para un futuro JOIN con otras tablas.
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
    // Generación de URLs para medios. En un caso real, aquí se generarían
    // URLs pre-firmadas si los archivos están en un bucket como S3.
    media: [
      ...(alarm.imagen ? [{ id: 'img1', type: 'image', url: alarm.imagen }] : []),
      ...(alarm.video ? [{ id: 'vid1', type: 'video', url: alarm.video }] : []),
    ],
    // Los comentarios necesitarían su propia tabla en la base de datos.
    comments: [],
  };
};


/**
 * Obtiene una lista paginada y ordenada de alarmas.
 */
export const getAllAlarms = async (req: Request, res: Response) => {
  try {
    // Busca las últimas 100 alarmas, ordenadas por fecha descendente.
    const alarmsFromDb = await prisma.alarmasHistorico.findMany({
      take: 100,
      orderBy: {
        alarmTime: 'desc',
      },
    });

    // Transforma cada alarma al formato que el frontend necesita.
    const transformedAlarms = alarmsFromDb.map(transformAlarmData);

    res.status(200).json(transformedAlarms);
  } catch (error) {
    console.error("Error al obtener alarmas:", error);
    res.status(500).json({ message: 'Error interno del servidor al obtener las alarmas.' });
  }
};

/**
 * Obtiene una única alarma por su GUID.
 */
export const getAlarmById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const alarmFromDb = await prisma.alarmasHistorico.findUnique({
      where: { guid: id },
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

/**
 * Actualiza el estado de una alarma. Usado para confirmar o rechazar.
 */
export const reviewAlarm = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // El frontend debe enviar un 'status'

  if (!status || !['confirmed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'El estado proporcionado no es válido. Debe ser "confirmed" o "rejected".' });
  }

  try {
    const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
      where: { guid: id },
      data: {
        estado: status,
      },
    });
    
    const transformedAlarm = transformAlarmData(updatedAlarmFromDb);
    res.status(200).json(transformedAlarm);
  } catch (error: any) {
    // Prisma arroja un error P2025 si no encuentra el registro a actualizar.
    if (error.code === 'P2025') {
        return res.status(404).json({ message: 'La alarma que intentas actualizar no existe.' });
    }
    console.error(`Error al actualizar la alarma ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar la alarma.' });
  }
};