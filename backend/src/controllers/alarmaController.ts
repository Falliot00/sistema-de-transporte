// backend/src/controllers/alarmaController.ts
import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { exec, execSync, ExecOptions } from 'child_process';
import path from 'path';
import { transformAlarmData } from '../utils/transformers';
import { generateAlarmReportPDF, generateDriverAlarmsSummaryPDF } from '../utils/pdfGenerator';
import { DB_QUERY_STATUS_MAP } from '../utils/statusHelpers';
import streamBuffers from 'stream-buffers';
import fs from 'fs';
import { s3Uploader } from '../utils/s3Uploader';

const prisma = new PrismaClient();

const alarmIncludes = {
    chofer: {
        include: {
            empresaInfo: true,
        },
    },
    typeAlarm: true,
    deviceInfo: true,
    anomaliaInfo: true,
    empresaInfo: true,
};

/**
 * Obtiene el comando correcto de Python segÃºn el sistema operativo
 */
const getPythonCommand = (): string => {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
        // Rutas posibles en Windows
        const possiblePaths = [
            path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe'),
            path.join(__dirname, '..', '..', '..', '.venv', 'Scripts', 'python.exe'),
            path.join(process.cwd(), 'backend', '.venv', 'Scripts', 'python.exe'),
            path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
            'python.exe',
            'python',
            'py'
        ];
        
        // Verificar cuÃ¡l existe y funciona
        for (const pythonPath of possiblePaths) {
            try {
                // Verificar si el archivo existe primero (para rutas absolutas)
                if (path.isAbsolute(pythonPath) && !fs.existsSync(pythonPath)) {
                    continue;
                }
                
                // Intenta ejecutar python --version
                execSync(`"${pythonPath}" --version`, { 
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                console.log(`[âœ“] Python encontrado en: ${pythonPath}`);
                return pythonPath;
            } catch (e) {
                // Si falla, continÃºa con el siguiente
                continue;
            }
        }
        
        // Si no encontramos nada, intentar con python del sistema
        console.warn('[âš ] No se encontrÃ³ Python en el entorno virtual, usando Python del sistema');
        return 'python';
        
    } else {
        // En Linux/Mac
        const possiblePaths = [
            path.join(__dirname, '..', '..', '.venv', 'bin', 'python3'),
            path.join(__dirname, '..', '..', '..', '.venv', 'bin', 'python3'),
            path.join(process.cwd(), 'backend', '.venv', 'bin', 'python3'),
            path.join(process.cwd(), '.venv', 'bin', 'python3'),
            'python3',
            'python'
        ];
        
        for (const pythonPath of possiblePaths) {
            try {
                if (path.isAbsolute(pythonPath) && !fs.existsSync(pythonPath)) {
                    continue;
                }
                execSync(`${pythonPath} --version`, { 
                    encoding: 'utf8',
                    stdio: 'pipe'
                });
                console.log(`[âœ“] Python encontrado en: ${pythonPath}`);
                return pythonPath;
            } catch (e) {
                continue;
            }
        }
        
        return 'python3';
    }
};


const resolveVideoScriptPath = (): string | null => {
    // Locate the video script when running from src or compiled dist output
    const scriptName = '_2video.py';
    const candidatePaths = [
        path.join(process.cwd(), 'backend', 'camaras', scriptName),
        path.join(process.cwd(), 'camaras', scriptName),
        path.join(__dirname, '..', '..', 'camaras', scriptName),
        path.join(__dirname, '..', '..', '..', 'camaras', scriptName),
    ];

    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
};

const triggerVideoScript = (alarm: { dispositivo: number | null, alarmTime: Date | null, guid: string }) => {
    if (!alarm.dispositivo || !alarm.alarmTime || !alarm.guid) {
        console.error(`[!] Datos insuficientes para descargar video de la alarma ${alarm.guid}.`);
        return;
    }
    
    try {
        const scriptPath = resolveVideoScriptPath();
        if (!scriptPath) {
            console.error('[ERROR] No se pudo resolver la ruta del script _2video.py.');
            return;
        }
        const pythonExecutable = getPythonCommand();
        const alarmTimeISO = alarm.alarmTime.toISOString();
        const dispositivoStr = alarm.dispositivo.toString();
        
        // Verificar que el script existe
        if (!fs.existsSync(scriptPath)) {
            console.error(`[âŒ] El script no existe en la ruta: ${scriptPath}`);
            return;
        }
        
        // Construir el comando
        let command: string;
        if (process.platform === 'win32') {
            // En Windows, usar comillas dobles y escapar correctamente
            command = `"${pythonExecutable}" "${scriptPath}" ${dispositivoStr} "${alarmTimeISO}" ${alarm.guid}`;
        } else {
            // En Linux/Mac
            command = `${pythonExecutable} "${scriptPath}" "${dispositivoStr}" "${alarmTimeISO}" "${alarm.guid}"`;
        }
        
        console.log(`[â–¶] Ejecutando comando para descarga de video: ${command}`);
        
        // Opciones de ejecuciÃ³n
        const execOptions: ExecOptions = {
            cwd: path.dirname(scriptPath),
            env: process.env,
            shell: process.platform === 'win32' ? 'cmd.exe' : undefined,
            windowsHide: true
        };
        
        // Ejecutar el comando
        exec(command, execOptions, (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
            const stdoutStr = stdout.toString();
            const stderrStr = stderr.toString();
            if (error) {
                console.error(`[âŒ] Error al ejecutar script de video para alarma ${alarm.guid}:`, error.message);
                // Log adicional para debugging
                console.error(`[âŒ] Error completo:`, error);
            }
            if (stderrStr) {
                console.error(`[!] Stderr de script de video para alarma ${alarm.guid}:`, stderrStr);
            }
            if (stdoutStr) {
                console.log(`[âœ”] Stdout de script de video para alarma ${alarm.guid}:`, stdoutStr);
            }
        });
        
    } catch (error) {
        console.error(`[âŒ] Error al configurar la ejecuciÃ³n del script de video:`, error);
    }
};

const buildWhereClause = (queryParams: any): Prisma.AlarmasHistoricoWhereInput => {
    const { status, search, type, company, startDate, endDate, includeRejected } = queryParams;
    let whereClause: Prisma.AlarmasHistoricoWhereInput = {};

    const normalizedStatus = Array.isArray(status) ? status[0] : status;
    const includeRejectedRaw = Array.isArray(includeRejected) ? includeRejected[0] : includeRejected;
    const shouldIncludeRejected = typeof includeRejectedRaw === 'string'
        ? ['true', '1'].includes(includeRejectedRaw.toLowerCase())
        : Boolean(includeRejectedRaw);

    if (normalizedStatus && normalizedStatus !== 'all' && DB_QUERY_STATUS_MAP[normalizedStatus as keyof typeof DB_QUERY_STATUS_MAP]) {
        whereClause.estado = { in: DB_QUERY_STATUS_MAP[normalizedStatus as keyof typeof DB_QUERY_STATUS_MAP] };
    } else if (!shouldIncludeRejected) {
        whereClause.estado = { notIn: DB_QUERY_STATUS_MAP.rejected };
    }
    if (startDate && endDate) {
        const endOfDay = new Date(endDate as string);
        endOfDay.setUTCHours(23, 59, 59, 999);
        whereClause.alarmTime = { gte: new Date(startDate as string), lte: endOfDay };
    }
    if (search) {
        whereClause.OR = [
            { deviceInfo: { patente: { contains: search } } },
            { interno: { contains: search } },
            { typeAlarm: { alarm: { contains: search } } },
            { chofer: { apellido_nombre: { contains: search } } },
        ];
    }
    const typeFilters = Array.isArray(type) ? type : (type ? [type] : []);
    if (typeFilters.length > 0) {
        whereClause.typeAlarm = { alarm: { in: typeFilters } };
    }
    
    const companyFilters = Array.isArray(company) ? company : (company ? [company] : []);
    if (companyFilters.length > 0) {
        const lowerCaseCompanies = companyFilters.map(c => c.toLowerCase());
        whereClause.empresaInfo = { 
            nombreMin: { 
                in: lowerCaseCompanies 
            } 
        };
    }
    return whereClause;
};

export const undoAlarmAction = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id }, include: alarmIncludes });
        if (!alarm) {
            return res.status(404).json({ message: 'La alarma que intentas revertir no existe.' });
        }
        if (alarm.estado === 'Pendiente') {
            return res.status(200).json(transformAlarmData(alarm));
        }
        const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: { estado: 'Pendiente', descripcion: null },
            include: alarmIncludes,
        });
        res.status(200).json(transformAlarmData(updatedAlarmFromDb));
    } catch (error: any) {
        console.error(`Error al revertir la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getAlarmsCount = async (req: Request, res: Response) => {
    try {
        const role = (req as any).user?.role as string | undefined;
        const statusParam = String((req.query.status as string) || 'all');

        if (role === 'USER' && (statusParam === 'confirmed' || statusParam === 'rejected')) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        let whereClause = buildWhereClause(req.query);
        if (role === 'USER' && (statusParam === 'all' || !statusParam)) {
            whereClause = {
                ...whereClause,
                estado: { in: [...DB_QUERY_STATUS_MAP.pending, ...DB_QUERY_STATUS_MAP.suspicious] },
            };
        }
        const count = await prisma.alarmasHistorico.count({ where: whereClause });
        res.status(200).json({ count });
    } catch (error) {
        console.error("â›” [ERROR] Falla en getAlarmsCount:", error);
        res.status(500).json({ message: 'Error interno del servidor al contar las alarmas.' });
    }
};

export const getAllAlarms = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const skip = (page - 1) * pageSize;
    try {
        const role = (req as any).user?.role as string | undefined;
        const statusParam = String((req.query.status as string) || 'all');

        if (role === 'USER' && (statusParam === 'confirmed' || statusParam === 'rejected')) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        let whereClause = buildWhereClause(req.query);
        if (role === 'USER' && (statusParam === 'all' || !statusParam)) {
            whereClause = {
                ...whereClause,
                estado: { in: [...DB_QUERY_STATUS_MAP.pending, ...DB_QUERY_STATUS_MAP.suspicious] },
            };
        }
        const alarmsFromDb = await prisma.alarmasHistorico.findMany({
            skip,
            take: pageSize,
            orderBy: { alarmTime: 'desc' },
            where: whereClause,
            include: alarmIncludes,
        });
        const totalAlarmsFiltered = await prisma.alarmasHistorico.count({ where: whereClause });
        const [totalConfirmedGlobal, totalRejectedGlobal, totalSuspiciousGlobal, totalPendingGlobal, totalAllAlarmsGlobal] = await Promise.all([
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
        console.error("â›” [ERROR] Falla en getAllAlarms:", error);
        res.status(500).json({ message: 'Error interno del servidor al consultar las alarmas.' });
    }
};

export const getAlarmById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarmFromDb = await prisma.alarmasHistorico.findUnique({
            where: { guid: id },
            include: alarmIncludes,
        });
        if (!alarmFromDb) {
            return res.status(404).json({ message: 'Alarma no encontrada.' });
        }
        res.status(200).json(transformAlarmData(alarmFromDb));
    } catch (error) {
        console.error(`Error al obtener la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const reviewAlarm = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, descripcion, choferId } = req.body;
    if (!status || !['confirmed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'La acciÃ³n proporcionada no es vÃ¡lida. Debe ser "confirmed" o "rejected".' });
    }
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) return res.status(404).json({ message: 'La alarma que intentas actualizar no existe.' });
        
        const statusToSave = status === 'confirmed' ? 'Sospechosa' : 'Rechazada';
        const dataToUpdate: Prisma.AlarmasHistoricoUpdateInput = { estado: statusToSave };

        if (descripcion) dataToUpdate.descripcion = descripcion;
        
        if (typeof choferId === 'number') {
            const choferToAssign = await prisma.choferes.findUnique({ where: { choferes_id: choferId } });
            if (!choferToAssign) return res.status(404).json({ message: `El chofer con ID ${choferId} no existe.` });
            if (choferToAssign.idEmpresa !== alarm.idEmpresa) {
                return res.status(400).json({ message: `El chofer ${choferToAssign.apellido_nombre} no pertenece a la empresa de la alarma.` });
            }
            dataToUpdate.chofer = { connect: { choferes_id: choferId } };
        }

        const updatedAlarmFromDb = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: alarmIncludes,
        });

        if (statusToSave === 'Sospechosa') {
            triggerVideoScript(updatedAlarmFromDb);
        }

        res.status(200).json(transformAlarmData(updatedAlarmFromDb));
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
        if (!alarm) return res.status(404).json({ message: 'Alarma no encontrada.' });
        
        let dataToUpdate: Prisma.AlarmasHistoricoUpdateInput = {};
        if (typeof choferId === 'number') {
            const choferToAssign = await prisma.choferes.findUnique({ where: { choferes_id: choferId } });
            if (!choferToAssign) return res.status(404).json({ message: `El chofer con ID ${choferId} no existe.` });
            if (choferToAssign.idEmpresa !== alarm.idEmpresa) return res.status(400).json({ message: `El chofer no pertenece a la empresa de la alarma.` });
            dataToUpdate.chofer = { connect: { choferes_id: choferId } };
        } else {
            dataToUpdate.chofer = { disconnect: true };
        }
        
        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: alarmIncludes,
        });
        res.status(200).json(transformAlarmData(updatedAlarm));
    } catch (error: any) {
        console.error(`Error al asignar chofer a la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const confirmFinalAlarm = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { descripcion, choferId, anomalyId } = req.body;
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) return res.status(404).json({ message: 'Alarma no encontrada.' });
        if (alarm.estado !== 'Sospechosa') return res.status(400).json({ message: `Solo se puede confirmar una alarma en estado "Sospechosa".` });
        
        const dataToUpdate: Prisma.AlarmasHistoricoUpdateInput = { 
            estado: 'Confirmada',
            informada: false // Establecer como no informada al confirmar
        };
        if (descripcion) dataToUpdate.descripcion = descripcion;
        
        if (typeof choferId !== 'number') return res.status(400).json({ message: "La selecciÃ³n de un chofer es obligatoria para confirmar la alarma." });
        
        const choferToAssign = await prisma.choferes.findUnique({ where: { choferes_id: choferId } });
        if (!choferToAssign) return res.status(404).json({ message: `El chofer con ID ${choferId} no existe.` });

        if (choferToAssign.idEmpresa !== alarm.idEmpresa) {
            return res.status(400).json({ message: `El chofer ${choferToAssign.apellido_nombre} no pertenece a la empresa de la alarma.` });
        }
        
        dataToUpdate.chofer = { connect: { choferes_id: choferId } };
        
        if (typeof anomalyId !== 'number') {
            return res.status(400).json({ message: "La selecciÃ³n de una anomalÃ­a es obligatoria para confirmar la alarma." });
        }
        
        const anomaliaToAssign = await prisma.anomalia.findUnique({ where: { idAnomalia: anomalyId } });
        if (!anomaliaToAssign) {
            return res.status(404).json({ message: `La anomalÃ­a con ID ${anomalyId} no existe.` });
        }
        
        dataToUpdate.anomaliaInfo = { connect: { idAnomalia: anomalyId } };

        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: alarmIncludes,
        });
        res.status(200).json(transformAlarmData(updatedAlarm));
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
        const dataToUpdate: Prisma.AlarmasHistoricoUpdateInput = { estado: 'Sospechosa' };
        if (descripcion) dataToUpdate.descripcion = descripcion;
        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: dataToUpdate,
            include: alarmIncludes,
        });
        triggerVideoScript(updatedAlarm);
        res.status(200).json(transformAlarmData(updatedAlarm));
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'La alarma no existe.' });
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const retryVideoDownload = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) return res.status(404).json({ message: 'Alarma no encontrada.' });
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

export const getAlarmReport = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({
            where: { guid: id },
            include: alarmIncludes,
        });
        if (!alarm) {
            return res.status(404).json({ message: 'Alarma no encontrada para generar el reporte.' });
        }
        
        const tempBufferStream = new streamBuffers.WritableStreamBuffer();
        await generateAlarmReportPDF(alarm, tempBufferStream, true);
        
        const tempBuffer = tempBufferStream.getContents();
        if (!tempBuffer) throw new Error('No se pudo generar el buffer del PDF.');

        const totalPages = (tempBuffer.toString().match(/\/Page\b/g) || []).length;
        
        const filename = `informe-alarma-${alarm.guid}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await new Promise<void>((resolve, reject) => {
            res.on('finish', resolve);
            res.on('error', reject);
            generateAlarmReportPDF(alarm, res, false, totalPages);
        });

    } catch (error) {
        console.error(`Error al generar el reporte para la alarma ${id}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error interno al generar el reporte.' });
        }
    }
};

export const updateAlarmDescription = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { description } = req.body;
    
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) {
            return res.status(404).json({ message: 'Alarma no encontrada.' });
        }
        
        if (alarm.estado !== 'Confirmada') {
            return res.status(400).json({ message: 'Solo se puede actualizar la descripciÃ³n de alarmas confirmadas.' });
        }
        
        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: { descripcion: description },
            include: alarmIncludes,
        });
        
        const transformedAlarm = transformAlarmData(updatedAlarm);
        res.json(transformedAlarm);
    } catch (error) {
        console.error(`Error al actualizar la descripciÃ³n de la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const updateAlarmAnomaly = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { anomalyId } = req.body;
    
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) {
            return res.status(404).json({ message: 'Alarma no encontrada.' });
        }
        
        if (alarm.estado !== 'Confirmada') {
            return res.status(400).json({ message: 'Solo se puede actualizar la anomalÃ­a de alarmas confirmadas.' });
        }
        
        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: { idAnomalia: anomalyId },
            include: alarmIncludes,
        });
        
        const transformedAlarm = transformAlarmData(updatedAlarm);
        res.json(transformedAlarm);
    } catch (error) {
        console.error(`Error al actualizar la anomalÃ­a de la alarma ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Función para marcar una alarma como informada
export const markAlarmAsReported = async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
        const alarm = await prisma.alarmasHistorico.findUnique({ where: { guid: id } });
        if (!alarm) {
            return res.status(404).json({ message: 'Alarma no encontrada.' });
        }
        
        if (alarm.estado !== 'Confirmada') {
            return res.status(400).json({ message: 'Solo se pueden informar alarmas confirmadas.' });
        }
        
        if (alarm.informada === true) {
            return res.status(400).json({ message: 'Esta alarma ya ha sido informada.' });
        }
        
        const updatedAlarm = await prisma.alarmasHistorico.update({
            where: { guid: id },
            data: { informada: true },
            include: alarmIncludes,
        });
        
        const transformedAlarm = transformAlarmData(updatedAlarm);
        res.json(transformedAlarm);
    } catch (error) {
        console.error(`Error al marcar la alarma ${id} como informada:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Función para generar informe de alarmas
export const generateAlarmReport = async (req: Request, res: Response) => {
    const { alarmIds } = req.body; // Array de GUIDs de alarmas
    
    //console.log('[DEBUG] generateAlarmReport called with:', { alarmIds });
    
    if (!Array.isArray(alarmIds) || alarmIds.length === 0) {
        //console.log('[ERROR] Invalid alarmIds:', alarmIds);
        return res.status(400).json({ message: 'Se debe proporcionar al menos una alarma para generar el informe.' });
    }
    
    try {
        //console.log('[DEBUG] Fetching alarms from database...');
        // Verificar que todas las alarmas existen y están confirmadas pero no informadas
        const alarms = await prisma.alarmasHistorico.findMany({
            where: { 
                guid: { in: alarmIds },
                estado: 'Confirmada',
                informada: false
            },
            include: {
                chofer: {
                    include: {
                        empresaInfo: true,
                    },
                },
                typeAlarm: true,
                deviceInfo: true,
                anomaliaInfo: true,
                empresaInfo: true,
            }
        });
        
        //console.log('[DEBUG] Found alarms:', alarms.length, 'of', alarmIds.length, 'requested');
        
        if (alarms.length !== alarmIds.length) {
            //console.log('[ERROR] Alarm count mismatch. Found:', alarms.length, 'Expected:', alarmIds.length);
            return res.status(400).json({ 
                message: 'Algunas alarmas no existen, no están confirmadas o ya han sido informadas.' 
            });
        }
        
        // Verificar que todas las alarmas pertenecen al mismo chofer
        const choferIds = [...new Set(alarms.map(alarm => alarm.choferId))];
        //console.log('[DEBUG] Unique chofer IDs found:', choferIds);
        
        if (choferIds.length !== 1 || !choferIds[0]) {
            //console.log('[ERROR] Multiple or no chofer IDs found:', choferIds);
            return res.status(400).json({ 
                message: 'Todas las alarmas deben pertenecer al mismo chofer.' 
            });
        }
        
        const choferId = choferIds[0];
        const chofer = alarms[0].chofer;
        
        if (!chofer) {
            //console.log('[ERROR] No chofer information found');
            return res.status(400).json({ 
                message: 'No se encontró información del chofer.' 
            });
        }
        
        //console.log('[DEBUG] Starting transaction...');
        // Usar transacción para asegurar consistencia
        const result = await prisma.$transaction(async (tx) => {
            //console.log('[DEBUG] Creating informe record...');
            // 1. Crear el informe
            const now = new Date();
            const informe = await tx.informes.create({
                data: {
                    fecha: now,
                    hora: now,
                    url: null // Se actualizará después de subir a S3
                }
            });
            
            //console.log('[DEBUG] Created informe with ID:', informe.idInforme);
            
            // 2. Crear las relaciones en informeAlarma
            const informeAlarmaData = alarmIds.map(alarmId => ({
                idInforme: informe.idInforme,
                idAlarma: alarmId
            }));
            
            //console.log('[DEBUG] Creating informeAlarma relations...');
            await tx.informeAlarma.createMany({
                data: informeAlarmaData
            });
            
            //console.log('[DEBUG] Preparing data for PDF generation...');
            // 3. Generar el PDF
            const driverAlarmsData = {
                chofer: chofer,
                alarmas: alarms.map(alarm => ({
                    ...alarm,
                    typeAlarm: alarm.typeAlarm,
                    deviceInfo: alarm.deviceInfo,
                    anomaliaInfo: alarm.anomaliaInfo
                }))
            };
            
            //console.log('[DEBUG] Generating PDF...');
            const pdfBuffer = await generateDriverAlarmsSummaryPDF(driverAlarmsData);
            //console.log('[DEBUG] PDF generated, buffer size:', pdfBuffer.length);
            
            // 4. Subir el PDF a S3
            const fileName = `informe-${choferId}-${informe.idInforme}-${now.getTime()}`;
            //console.log('[DEBUG] Uploading to S3 with filename:', fileName);
            
            const uploadResult = await s3Uploader.uploadPDFReport(pdfBuffer, fileName, choferId);
            //console.log('[DEBUG] Upload result:', uploadResult);
            
            if (!uploadResult.success) {
                throw new Error(`Error al subir PDF a S3: ${uploadResult.error}`);
            }
            
            //console.log('[DEBUG] Updating informe with URL...');
            // 5. Actualizar el informe con la URL
            const informeUpdated = await tx.informes.update({
                where: { idInforme: informe.idInforme },
                data: { url: uploadResult.url }
            });
            
            //console.log('[DEBUG] Marking alarms as informed...');
            // 6. Marcar las alarmas como informadas
            await tx.alarmasHistorico.updateMany({
                where: { guid: { in: alarmIds } },
                data: { informada: true }
            });
            
            //console.log('[DEBUG] Transaction completed successfully');
            return {
                informe: informeUpdated,
                uploadResult,
                alarmasCount: alarms.length
            };
        });
        
        //console.log('[DEBUG] Sending success response...');
        res.json({
            message: 'Informe generado exitosamente',
            informe: {
                id: result.informe.idInforme,
                fecha: result.informe.fecha,
                hora: result.informe.hora,
                url: result.informe.url,
                alarmas: result.alarmasCount
            }
        });
        
    } catch (error) {
        console.error('[ERROR] Error al generar el informe de alarmas:', error);
        
        // Log más detallado del error
        if (error instanceof Error) {
            console.error('[ERROR] Error message:', error.message);
            console.error('[ERROR] Error stack:', error.stack);
        }
        
        res.status(500).json({ 
            message: 'Error interno del servidor.',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
