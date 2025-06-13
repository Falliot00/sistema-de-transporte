// backend/src/controllers/alarmaController.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAlarmStatus = (dbStatus: string | null | undefined): 'pending' | 'confirmed' | 'rejected' => {
  const trimmedStatus = dbStatus?.trim().toLowerCase();
  if (trimmedStatus === 'confirmed' || trimmedStatus === 'rejected') {
    return trimmedStatus;
  }
  return 'pending';
};

const transformAlarmData = (alarm: any) => {
  return {
    id: alarm.guid,
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

export const getAllAlarms = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const status = req.query.status as string;
    const searchQuery = req.query.search as string;

    const where: Prisma.alarmasHistoricoWhereInput = {};

    if (status && status !== 'all') {
      if (status === 'pending') {
        where.estado = { not: { in: ['confirmed', 'rejected'] } };
      } else {
        where.estado = status;
      }
    }

    if (searchQuery) {
      // --- CORRECCIÓN APLICADA AQUÍ ---
      // Se elimina 'mode: 'insensitive'' para compatibilidad con versiones antiguas de Prisma.
      // La búsqueda ahora será sensible a mayúsculas y minúsculas.
      where.OR = [
        { patente: { contains: searchQuery } },
        { interno: { contains: searchQuery } },
        { typeAlarm: { alarm: { contains: searchQuery } } },
      ];
    }
    
    const [alarmsFromDb, totalAlarms] = await prisma.$transaction([
      prisma.alarmasHistorico.findMany({
        where,
        skip,
        take: limit,
        orderBy: { alarmTime: 'desc' },
        include: { typeAlarm: true },
      }),
      prisma.alarmasHistorico.count({ where }),
    ]);

    const transformedAlarms = alarmsFromDb.map(transformAlarmData);
    
    res.status(200).json({
      alarms: transformedAlarms,
      pagination: {
        page,
        limit,
        totalAlarms,
        totalPages: Math.ceil(totalAlarms / limit),
      },
    });

  } catch (error) {
    console.error("Error al obtener alarmas:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};


export const getAlarmById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const alarmFromDb = await prisma.alarmasHistorico.findUnique({
            where: { guid: id },
            include: { typeAlarm: true },
        });
        if (!alarmFromDb) {
            res.status(404).json({ message: 'Alarma no encontrada.' });
            return;
        }
        const transformedAlarm = transformAlarmData(alarmFromDb);
        res.status(200).json(transformedAlarm);
    } catch (error) {
        console.error(`Error al obtener la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


export const reviewAlarm = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['confirmed', 'rejected'].includes(status)) {
    res.status(400).json({ message: 'El estado proporcionado no es válido.' });
    return;
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
        res.status(404).json({ message: 'La alarma que intentas actualizar no existe.' });
        return;
    }
    console.error(`Error al actualizar la alarma ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};


export const getPendingAlarms = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const pendingCriteria = {
    not: {
      in: ['confirmed', 'rejected'],
    },
  };

  try {
    const [alarms, total] = await prisma.$transaction([
      prisma.alarmasHistorico.findMany({
        where: {
          estado: pendingCriteria,
        },
        take: limit,
        skip: skip,
        orderBy: {
          alarmTime: 'asc', 
        },
        include: {
          typeAlarm: true,
        },
      }),
      prisma.alarmasHistorico.count({
        where: {
          estado: pendingCriteria,
        },
      }),
    ]);

    const transformedAlarms = alarms.map(transformAlarmData);
    
    res.status(200).json({
      alarms: transformedAlarms,
      total,
      page,
      limit,
      hasNextPage: skip + alarms.length < total,
    });

  } catch (error) {
    console.error("Error al obtener alarmas pendientes:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};