import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const transformAlarmData = (alarm: any) => {
  return {
    id: alarm.guid,
    status: alarm.estado || 'pending',
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

export const getAllAlarms = async (req: Request, res: Response) => {
  try {
    const alarmsFromDb = await prisma.alarmasHistorico.findMany({
      take: 100,
      orderBy: { alarmTime: 'desc' },
      include: {
        typeAlarm: true, 
      },
    });
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
            include: {
                typeAlarm: true,
            },
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

// --- FUNCIÓN CORREGIDA CON "EXPORT" ---
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
      include: { typeAlarm: true } // Incluimos para devolver el objeto completo
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