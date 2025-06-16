// backend/src/controllers/alarmaController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

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

const transformAlarmData = (alarm: any) => ({
    id: alarm.guid,
    status: getAlarmStatusForFrontend(alarm.estado),
    rawStatus: alarm.estado,
    type: alarm.typeAlarm ? alarm.typeAlarm.alarm : 'Tipo Desconocido',
    timestamp: alarm.alarmTime,
    videoProcessing: (alarm.estado === 'Sospechosa' && !alarm.video),
    location: {
      latitude: parseFloat(alarm.lat) || 0,
      longitude: parseFloat(alarm.lng) || 0,
      address: alarm.ubi || 'Dirección no disponible',
    },
    driver: { id: `chofer-${alarm.interno}`, name: `Chofer ${alarm.interno || 'Desconocido'}`, license: 'Licencia pendiente' },
    vehicle: { id: `vehiculo-${alarm.patente}`, licensePlate: alarm.patente || 'Patente desconocida', model: 'Modelo pendiente' },
    device: { id: `disp-${alarm.dispositivo}`, name: `Dispositivo ${alarm.dispositivo || 'Desconocido'}`, serialNumber: alarm.dispositivo || 'N/A' },
    media: [
      ...(alarm.imagen ? [{ id: 'img1', type: 'image' as const, url: alarm.imagen }] : []),
      ...(alarm.video ? [{ id: 'vid1', type: 'video' as const, url: alarm.video }] : []),
    ],
    comments: [],
});

export const getAllAlarms = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;
  const statusFilter = req.query.status as string;
  const search = req.query.search as string;
  const typeFilters = req.query.type as string[] | string;

  const skip = (page - 1) * pageSize;
  let whereClause: any = {};

  // --- INICIO DE LA SOLUCIÓN: Lógica de filtrado más limpia ---
  // Ahora cada estado lógico del frontend corresponde a un único estado en la BD.
  if (statusFilter && statusFilter !== 'all') {
    const dbStates = DB_QUERY_STATUS_MAP[statusFilter as keyof typeof DB_QUERY_STATUS_MAP];
    if (dbStates) {
        whereClause.estado = { in: dbStates };
    }
  }
  // --- FIN DE LA SOLUCIÓN ---

  if (search) {
    whereClause.OR = [
      { patente: { contains: search } },
      { interno: { contains: search } },
      { typeAlarm: { alarm: { contains: search } } },
    ];
  }

  if (typeFilters && (Array.isArray(typeFilters) ? typeFilters.length > 0 : typeFilters.trim() !== '')) {
      const typesToFilter = Array.isArray(typeFilters) ? typeFilters : [typeFilters];
      whereClause.typeAlarm = { alarm: { in: typesToFilter } };
  }

  try {
    const alarmsFromDb = await prisma.alarmasHistorico.findMany({
      skip, take: pageSize, orderBy: { alarmTime: 'desc' }, where: whereClause, include: { typeAlarm: true },
    });
    const transformedAlarms = alarmsFromDb.map(transformAlarmData);
    const totalAlarmsFiltered = await prisma.alarmasHistorico.count({ where: whereClause });

    const totalConfirmedGlobal = await prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.confirmed } } });
    const totalRejectedGlobal = await prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.rejected } } });
    const totalSuspiciousGlobal = await prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.suspicious } } });
    const totalPendingGlobal = await prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.pending } } });
    const totalAllAlarmsGlobal = await prisma.alarmasHistorico.count();

    res.status(200).json({
      alarms: transformedAlarms,
      pagination: { totalAlarms: totalAlarmsFiltered, currentPage: page, pageSize, totalPages: Math.ceil(totalAlarmsFiltered / pageSize), hasNextPage: (page * pageSize) < totalAlarmsFiltered, hasPrevPage: page > 1 },
      globalCounts: { total: totalAllAlarmsGlobal, pending: totalPendingGlobal, suspicious: totalSuspiciousGlobal, confirmed: totalConfirmedGlobal, rejected: totalRejectedGlobal },
    });
  } catch (error) {
    console.error("Error al obtener alarmas:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// El resto de las funciones (getAlarmById, reviewAlarm, confirmFinalAlarm) no necesitan cambios.
// ... (resto del archivo)
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
    return res.status(400).json({ message: 'La acción proporcionada no es válida.' });
  }

  try {
    const statusToSave = status === 'confirmed' ? 'Sospechosa' : 'Rechazada';
    const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
      where: { guid: id },
      data: { estado: statusToSave },
      include: { typeAlarm: true }
    });

    if (statusToSave === 'Sospechosa') {
      console.log(`[+] Estado 'Sospechosa' detectado para la alarma ${id}. Lanzando script de video...`);
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

        exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
          if (error) console.error(`❌ Error al ejecutar el script de Python: ${error.message}`);
          if (stderr) console.error(`🐍 Error en script Python (stderr): ${stderr}`);
          if (stdout) console.log(`🐍 Salida del script Python (stdout):\n${stdout}`);
        });
      }
    }

    const transformedAlarm = transformAlarmData(updatedAlarmFromDb);
    res.status(200).json(transformedAlarm);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'La alarma que intentas actualizar no existe.' });
    }
    console.error(`Error al revisar la alarma ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const confirmFinalAlarm = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) return res.status(404).json({ message: 'Alarma no encontrada.' });
        if (alarm.estado !== 'Sospechosa') return res.status(400).json({ message: `Solo se puede confirmar una alarma "Sospechosa". Estado actual: ${alarm.estado}` });
        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: { estado: 'Confirmada' },
            include: { typeAlarm: true }
        });
        const transformedAlarm = transformAlarmData(updatedAlarm);
        res.status(200).json(transformedAlarm);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'La alarma que intentas confirmar no existe.' });
        console.error(`Error al confirmar la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};