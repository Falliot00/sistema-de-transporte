// backend/src/controllers/choferesController.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { transformAlarmData } from '../utils/transformers';
import { DB_QUERY_STATUS_MAP } from '../utils/statusHelpers';

const prisma = new PrismaClient();

const alarmIncludesForDriverDetails = {
    typeAlarm: true,
    deviceInfo: true,
    anomaliaInfo: true,
    empresaInfo: true
};

export const getAllChoferes = async (req: Request, res: Response) => {
    const { search, company } = req.query;

    let whereClause: Prisma.ChoferesWhereInput = {
        sector: {
        in: ['CHOFERES', 'TALLER (varios)', 'TALLER (Jefes)']
    },
    estado: 'A',
    liquidacionEstado: 'A',
    };

    if (search && typeof search === 'string') {
        whereClause.OR = [
            { apellido_nombre: { contains: search } },
            { dni: { contains: search } },
        ];
    }
    
    const companyFilters = Array.isArray(company) ? company : (company ? [company] : []);
    if (companyFilters.length > 0) {
        const lowerCaseCompanies = companyFilters.map(c => (c as string).toLowerCase());
        whereClause.empresaInfo = {
            nombreMin: { in: lowerCaseCompanies }
        };
    }

    try {
        const choferesFromDb = await prisma.choferes.findMany({
            where: whereClause,
            orderBy: [{ apellido_nombre: 'asc' }],
            include: {
                empresaInfo: true,
            }
        });
        
        const choferes = choferesFromDb.map((chofer: any) => ({
            choferes_id: chofer.choferes_id,
            apellido_nombre: chofer.apellido_nombre || '',
            foto: chofer.foto,
            dni: chofer.dni,
            anios: chofer.anios,
            empresa: chofer.empresaInfo?.nombreMin || 'Empresa Desconocida',
            estado: chofer.estado,
            sector: chofer.sector,
            puesto: chofer.puesto,
        }));
        
        res.status(200).json(choferes);
    } catch (error) {
        console.error("Error al obtener la lista de choferes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getDriverByIdWithStats = async (req: Request, res: Response) => {
    const { id } = req.params;
    const driverId = parseInt(id, 10);

    // Obtener parámetros de filtro de la query
    const { startDate, endDate, type, company, status } = req.query;

    if (isNaN(driverId)) {
        return res.status(400).json({ message: 'El ID del chofer debe ser un número.' });
    }

    try {
        const driver = await prisma.choferes.findUnique({
            where: { 
                choferes_id: driverId,
                sector: 'CHOFERES',
                estado: 'A',
                liquidacionEstado: 'A',
            }, 
            include: {
                empresaInfo: true,
            }
        });

        if (!driver) {
            return res.status(404).json({ message: 'Chofer no encontrado o inactivo.' });
        }

        // Construir where clause para las alarmas
        let alarmasWhereClause: Prisma.AlarmasHistoricoWhereInput = {
            choferId: driverId
        };

        // Aplicar filtros de fecha
        if (startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            end.setUTCHours(23, 59, 59, 999);
            alarmasWhereClause.alarmTime = { gte: start, lte: end };
        }

        // Aplicar filtros de tipo
        const typeFilters = Array.isArray(type) 
            ? type.map(t => String(t)) 
            : (type ? [String(type)] : []);
        if (typeFilters.length > 0) {
            alarmasWhereClause.typeAlarm = { alarm: { in: typeFilters } };
        }

        // Aplicar filtros de empresa
        const companyFilters = Array.isArray(company) 
            ? company.map(c => String(c)) 
            : (company ? [String(company)] : []);
        if (companyFilters.length > 0) {
            const lowerCaseCompanies = companyFilters.map(c => c.toLowerCase());
            alarmasWhereClause.empresaInfo = { 
                nombreMin: { in: lowerCaseCompanies } 
            };
        }

        // Aplicar filtros de estado
        if (status && status !== 'all' && DB_QUERY_STATUS_MAP[status as keyof typeof DB_QUERY_STATUS_MAP]) {
            alarmasWhereClause.estado = { in: DB_QUERY_STATUS_MAP[status as keyof typeof DB_QUERY_STATUS_MAP] };
        }

        // Obtener las alarmas filtradas
        const alarmasFiltradasFromDb = await prisma.alarmasHistorico.findMany({
            where: alarmasWhereClause,
            take: 10,
            orderBy: { alarmTime: 'desc' },
            include: alarmIncludesForDriverDetails
        });

        // Obtener estadísticas generales (sin filtros, históricas)
        const [totalAlarms, pendingAlarms, suspiciousAlarms, confirmedAlarms, rejectedAlarms] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { choferId: driverId } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.pending } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.suspicious } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.confirmed } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.rejected } } }),
        ]);

        const recentAlarmsTransformed = alarmasFiltradasFromDb.map(alarm => transformAlarmData({ ...alarm, chofer: driver }));
        
        const responsePayload = {
            choferes_id: driver.choferes_id,
            apellido_nombre: driver.apellido_nombre,
            foto: driver.foto,
            dni: driver.dni,
            anios: driver.anios,
            empresa: (driver as any).empresaInfo?.nombreMin || 'Empresa Desconocida',
            stats: {
                total: totalAlarms,
                pending: pendingAlarms,
                suspicious: suspiciousAlarms,
                confirmed: confirmedAlarms,
                rejected: rejectedAlarms,
            },
            alarmas: recentAlarmsTransformed
        };

        res.status(200).json(responsePayload);
    } catch (error) {
        console.error(`Error al obtener detalles del chofer ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};