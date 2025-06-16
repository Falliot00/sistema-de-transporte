// backend/src/controllers/alarmaController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

// ... (las funciones getAlarmStatus y transformAlarmData permanecen iguales)
const DB_QUERY_STATUS_MAP: Record<'pending' | 'confirmed' | 'rejected', string[]> = {
  pending: ['Pendiente', 'Sospechosa'],
  confirmed: ['Confirmada', 'confirmed'],
  rejected: ['Rechazada', 'rejected'],
};

const getAlarmStatus = (dbStatus: string | null | undefined): 'pending' | 'confirmed' | 'rejected' => {
  const lowercasedStatus = dbStatus?.trim().toLowerCase();
  if (!lowercasedStatus) return 'pending';
  if (DB_QUERY_STATUS_MAP.confirmed.map(s => s.toLowerCase()).includes(lowercasedStatus)) {
    return 'confirmed';
  }
  if (DB_QUERY_STATUS_MAP.rejected.map(s => s.toLowerCase()).includes(lowercasedStatus)) {
    return 'rejected';
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


// ... (las funciones getAllAlarms y getAlarmById permanecen iguales)
export const getAllAlarms = async (req: Request, res: Response) => {
  // ... (código sin cambios)
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;
  const statusFilter = req.query.status as string;
  const search = req.query.search as string;
  const typeFilters = req.query.type as string[] | string;

  const skip = (page - 1) * pageSize;

  let whereClause: any = {};

  if (statusFilter && statusFilter !== 'all') {
    whereClause.estado = {
        in: DB_QUERY_STATUS_MAP[statusFilter as keyof typeof DB_QUERY_STATUS_MAP]
    };
  }

  if (search) {
    whereClause.OR = [
      { patente: { contains: search } },
      { interno: { contains: search } },
      { typeAlarm: { alarm: { contains: search } } },
    ];
  }

  if (typeFilters && (Array.isArray(typeFilters) ? typeFilters.length > 0 : typeFilters.trim() !== '')) {
      const typesToFilter = Array.isArray(typeFilters) ? typeFilters : [typeFilters];
      whereClause.typeAlarm = {
          alarm: {
              in: typesToFilter,
          }
      };
  }

  try {
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

    const totalAlarmsFiltered = await prisma.alarmasHistorico.count({
      where: whereClause,
    });

    const totalConfirmedGlobal = await prisma.alarmasHistorico.count({
      where: { estado: { in: DB_QUERY_STATUS_MAP.confirmed } },
    });
    const totalRejectedGlobal = await prisma.alarmasHistorico.count({
      where: { estado: { in: DB_QUERY_STATUS_MAP.rejected } },
    });
    const totalPendingGlobal = await prisma.alarmasHistorico.count({
      where: { estado: { in: DB_QUERY_STATUS_MAP.pending } },
    });
    const totalAllAlarmsGlobal = await prisma.alarmasHistorico.count();

    res.status(200).json({
      alarms: transformedAlarms,
      pagination: {
        totalAlarms: totalAlarmsFiltered,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(totalAlarmsFiltered / pageSize),
        hasNextPage: (page * pageSize) < totalAlarmsFiltered,
        hasPrevPage: page > 1,
      },
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
  const { status } = req.body;

  if (!status || !['confirmed', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'El estado proporcionado no es válido.' });
  }

  try {
    const statusToSave = DB_QUERY_STATUS_MAP[status as keyof typeof DB_QUERY_STATUS_MAP][0];

    const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
      where: { guid: id },
      data: { estado: statusToSave },
      include: { typeAlarm: true }
    });

    if (status === 'confirmed') {
      console.log(`[+] Estado 'confirmed' detectado para la alarma ${id}. Lanzando script de video...`);

      const dispositivo = updatedAlarmFromDb.dispositivo;
      const alarmTime = updatedAlarmFromDb.alarmTime;
      const guid = updatedAlarmFromDb.guid;

      if (dispositivo && alarmTime && guid) {
        const venvDir = '.venv';
        const scriptDir = 'camaras';
        const scriptName = '_2video.py';

        const pythonExecutable = process.platform === 'win32'
          ? path.join(__dirname, '..', '..', venvDir, 'Scripts', 'python.exe')
          : path.join(__dirname, '..', '..', venvDir, 'bin', 'python3');

        const scriptPath = path.join(__dirname, '..', '..', scriptDir, scriptName);
        
        const formattedAlarmTime = alarmTime.toISOString();

        const command = `"${pythonExecutable}" "${scriptPath}" "${dispositivo}" "${formattedAlarmTime}" "${guid}"`;
        
        console.log(`[+] Ejecutando comando: ${command}`);

        // --- INICIO DE LA SOLUCIÓN ---
        // Añadimos el objeto de opciones para forzar la codificación UTF-8
        exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
        // --- FIN DE LA SOLUCIÓN ---
          if (error) {
            console.error(`❌ Error al ejecutar el script de Python: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`🐍 Error en script Python (stderr): ${stderr}`);
            return;
          }
          console.log(`🐍 Salida del script Python (stdout):\n${stdout}`);
        });

      } else {
        console.warn(`[!] Faltan datos para ejecutar el script de video para la alarma ${id}.`);
      }
    }

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