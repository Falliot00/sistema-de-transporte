import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- INICIO DE LA SOLUCIÓN ---

// 1. Creamos una función de ayuda para validar y limpiar el estado.
const getAlarmStatus = (dbStatus: string | null | undefined): 'pending' | 'confirmed' | 'rejected' => {
  // Quitamos espacios en blanco y convertimos a minúsculas para una comparación segura.
  const trimmedStatus = dbStatus?.trim().toLowerCase();

  // Comprobamos si el estado es uno de los valores finales válidos.
  if (trimmedStatus === 'confirmed' || trimmedStatus === 'rejected') {
    return trimmedStatus;
  }
  
  // Si no es 'confirmed' o 'rejected', SIEMPRE será 'pending'.
  return 'pending';
};

const transformAlarmData = (alarm: any) => {
  return {
    id: alarm.guid,
    // 2. Usamos nuestra nueva función robusta en lugar de la lógica simple.
    status: getAlarmStatus(alarm.estado),
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

// --- FIN DE LA SOLUCIÓN ---


export const getAllAlarms = async (req: Request, res: Response) => {
  try {
    const alarmsFromDb = await prisma.alarmasHistorico.findMany({
      take: 100,
      orderBy: { alarmTime: 'desc' },
      include: {
        typeAlarm: true, 
      },
    });
    // Ahora esta transformación es segura y siempre producirá datos limpios.
    const transformedAlarms = alarmsFromDb.map(transformAlarmData);
    res.status(200).json(transformedAlarms);
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
  const { status } = req.body;

  if (!status || !['confirmed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'El estado proporcionado no es válido.' });
  }

  try {
    const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
      where: { guid: id },
      data: { estado: status },
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