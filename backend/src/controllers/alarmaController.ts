// backend/src/controllers/alarmaController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';
import { transformAlarmData } from '../utils/transformers';

const prisma = new PrismaClient();

const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

const triggerVideoScript = (alarm: { dispositivo: string | null, alarmTime: Date | null, guid: string }) => {
    if (!alarm.dispositivo || !alarm.alarmTime || !alarm.guid) {
        console.error(`[!] Datos insuficientes para descargar video de la alarma ${alarm.guid}.`);
        return;
    }
    const scriptPath = path.join(__dirname, '..', '..', 'camaras', '_2video.py');
    const pythonExecutable = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
    const alarmTimeISO = alarm.alarmTime.toISOString();
    const command = `"${pythonExecutable}" "${scriptPath}" "${alarm.dispositivo}" "${alarmTimeISO}" "${alarm.guid}"`;
    console.log(`[▶] Ejecutando comando para descarga de video: ${command}`);
    exec(command, (error, stdout, stderr) => {
        if (error) console.error(`[❌] Error al ejecutar script de video para alarma ${alarm.guid}: ${error.message}`);
        if (stderr) console.error(`[!] Stderr de script de video para alarma ${alarm.guid}: ${stderr}`);
        console.log(`[✔] Stdout de script de video para alarma ${alarm.guid}: ${stdout}`);
    });
};

export const getAllAlarms = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const statusFilter = req.query.status as string;
    const search = req.query.search as string;
    const typeFilters = req.query.type as string[] | string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // --- INICIO DE LA SOLUCIÓN: Capturar nuevo filtro de empresa ---
    const companyFilters = req.query.company as string[] | string;
    // --- FIN DE LA SOLUCIÓN ---
  
    const skip = (page - 1) * pageSize;
    let whereClause: any = {};
  
    if (statusFilter && statusFilter !== 'all') {
      const dbStates = DB_QUERY_STATUS_MAP[statusFilter as keyof typeof DB_QUERY_STATUS_MAP];
      if (dbStates) {
          whereClause.estado = { in: dbStates };
      }
    }
  
    if (startDate && endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      whereClause.alarmTime = { gte: new Date(startDate), lte: endOfDay };
    }
  
    if (search) {
      whereClause.OR = [
        { patente: { contains: search } },
        { interno: { contains: search } },
        { typeAlarm: { alarm: { contains: search } } },
        { chofer: { nombre: { contains: search }}},
        { chofer: { apellido: { contains: search }}},
      ];
    }
  
    if (typeFilters && (Array.isArray(typeFilters) ? typeFilters.length > 0 : typeFilters.trim() !== '')) {
        const typesToFilter = Array.isArray(typeFilters) ? typeFilters : [typeFilters];
        whereClause.typeAlarm = { alarm: { in: typesToFilter } };
    }

    // --- INICIO DE LA SOLUCIÓN: Aplicar filtro de empresa a la consulta ---
    if (companyFilters && (Array.isArray(companyFilters) ? companyFilters.length > 0 : companyFilters.trim() !== '')) {
        const companiesToFilter = Array.isArray(companyFilters) ? companyFilters : [companyFilters];
        whereClause.Empresa = { in: companiesToFilter };
    }
    // --- FIN DE LA SOLUCIÓN ---

    try {
        const alarmsFromDb = await prisma.alarmasHistorico.findMany({
            skip,
            take: pageSize,
            orderBy: { alarmTime: 'desc' },
            where: whereClause,
            include: { chofer: true, typeAlarm: true },
        });
        
        const totalAlarmsFiltered = await prisma.alarmasHistorico.count({ where: whereClause });

        const [
            totalConfirmedGlobal, totalRejectedGlobal, totalSuspiciousGlobal, totalPendingGlobal, totalAllAlarmsGlobal
        ] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.confirmed } } }),
            prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.rejected } } }),
            prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.suspicious } } }),
            prisma.alarmasHistorico.count({ where: { estado: { in: DB_QUERY_STATUS_MAP.pending } } }),
            prisma.alarmasHistorico.count(),
        ]);
        
        const transformedAlarms = alarmsFromDb.map(transformAlarmData);
    
        res.status(200).json({
          alarms: transformedAlarms,
          pagination: { totalAlarms: totalAlarmsFiltered, currentPage: page, pageSize, totalPages: Math.ceil(totalAlarmsFiltered / pageSize), hasNextPage: (page * pageSize) < totalAlarmsFiltered, hasPrevPage: page > 1 },
          globalCounts: { total: totalAllAlarmsGlobal, pending: totalPendingGlobal, suspicious: totalSuspiciousGlobal, confirmed: totalConfirmedGlobal, rejected: totalRejectedGlobal },
        });
    } catch (error) {
        console.error("⛔ [ERROR] Falla en getAllAlarms:", error);
        res.status(500).json({ message: 'Error interno del servidor al consultar las alarmas.' });
    }
};

// El resto de los controladores (getAlarmById, reviewAlarm, etc.) permanecen sin cambios.
// ... (resto del archivo igual)
export const getAlarmById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarmFromDb = await prisma.alarmasHistorico.findUnique({
            where: { guid: id },
            include: { chofer: true, typeAlarm: true },
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
    const { status, descripcion, choferId } = req.body;

    if (!status || !['confirmed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'La acción proporcionada no es válida. Debe ser "confirmed" o "rejected".' });
    }

    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) return res.status(404).json({ message: 'La alarma que intentas actualizar no existe.' });
        
        const statusToSave = status === 'confirmed' ? 'Sospechosa' : 'Rechazada';
        const dataToUpdate: { estado: string; descripcion?: string; choferId?: number } = { estado: statusToSave };

        if (descripcion) dataToUpdate.descripcion = descripcion;
        
        if (typeof choferId === 'number') {
            const choferToAssign = await prisma.choferes.findUnique({ where: { choferes_id: choferId } });
            if (!choferToAssign) {
                return res.status(404).json({ message: `El chofer con ID ${choferId} no existe.` });
            }
            if (choferToAssign.empresa !== alarm.Empresa) {
                return res.status(400).json({ message: `El chofer ${choferToAssign.nombre} no pertenece a la empresa ${alarm.Empresa}.` });
            }
            dataToUpdate.choferId = choferId;
        }

        const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: { chofer: true, typeAlarm: true }
        });

        if (statusToSave === 'Sospechosa') {
            triggerVideoScript(updatedAlarmFromDb);
        }

        const transformedAlarm = transformAlarmData(updatedAlarmFromDb);
        res.status(200).json(transformedAlarm);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'La alarma que intentas actualizar no existe.' });
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const assignDriverToAlarm = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { choferId } = req.body;

    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) {
            return res.status(404).json({ message: 'Alarma no encontrada.' });
        }

        let dataToUpdate: { choferId: number | null } = { choferId: null };

        if (typeof choferId === 'number') {
            const choferToAssign = await prisma.choferes.findUnique({ where: { choferes_id: choferId } });
            if (!choferToAssign) {
                return res.status(404).json({ message: `El chofer con ID ${choferId} no existe.` });
            }
            if (choferToAssign.empresa !== alarm.Empresa) {
                return res.status(400).json({ message: `El chofer no pertenece a la empresa de la alarma.` });
            }
            dataToUpdate.choferId = choferId;
        }
        
        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: { chofer: true, typeAlarm: true }
        });

        const transformedAlarm = transformAlarmData(updatedAlarm);
        res.status(200).json(transformedAlarm);
    } catch (error: any) {
        console.error(`Error al asignar chofer a la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const confirmFinalAlarm = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { descripcion, choferId } = req.body;

    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) return res.status(404).json({ message: 'Alarma no encontrada.' });
        if (alarm.estado !== 'Sospechosa') return res.status(400).json({ message: `Solo se puede confirmar una alarma en estado "Sospechosa".` });
        
        const dataToUpdate: { estado: string; descripcion?: string, choferId?: number } = { estado: 'Confirmada' };
        if (descripcion) dataToUpdate.descripcion = descripcion;
        
        if (typeof choferId !== 'number') {
            return res.status(400).json({ message: "La selección de un chofer es obligatoria para confirmar la alarma." });
        }
        const choferToAssign = await prisma.choferes.findUnique({ where: { choferes_id: choferId } });

        if (!choferToAssign) {
            return res.status(404).json({ message: `El chofer con ID ${choferId} no existe.` });
        }
        if (choferToAssign.empresa !== alarm.Empresa) {
            return res.status(400).json({ message: `El chofer ${choferToAssign.nombre} no pertenece a la empresa ${alarm.Empresa}.` });
        }
        dataToUpdate.choferId = choferId;

        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: { chofer: true, typeAlarm: true }
        });
        const transformedAlarm = transformAlarmData(updatedAlarm);
        res.status(200).json(transformedAlarm);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'La alarma no existe.' });
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const reEvaluateAlarm = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { descripcion } = req.body;

    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) return res.status(404).json({ message: 'Alarma no encontrada.' });
        if (!DB_QUERY_STATUS_MAP.rejected.map(s => s.toLowerCase()).includes(alarm.estado?.toLowerCase() || '')) {
            return res.status(400).json({ message: `Solo se puede re-evaluar una alarma en estado "Rechazada".` });
        }
        
        const dataToUpdate: { estado: string; descripcion?: string } = { estado: 'Sospechosa' };
        if (descripcion) {
            dataToUpdate.descripcion = descripcion;
        }

        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: { chofer: true, typeAlarm: true }
        });

        triggerVideoScript(updatedAlarm);
        const transformedAlarm = transformAlarmData(updatedAlarm);
        res.status(200).json(transformedAlarm);
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'La alarma no existe.' });
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const retryVideoDownload = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) {
            return res.status(404).json({ message: 'Alarma no encontrada.' });
        }
        if (alarm.estado !== 'Sospechosa') {
            return res.status(400).json({ message: `Solo se puede reintentar el video para una alarma "Sospechosa".` });
        }

        console.log(`[+] Reintentando descarga de video para la alarma ${id}...`);
        triggerVideoScript(alarm);
        
        res.status(202).json({ message: 'Se ha iniciado el re-procesamiento del video.' });

    } catch (error: any) {
        console.error(`Error al reintentar el video para la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};