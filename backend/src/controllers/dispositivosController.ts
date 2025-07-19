// backend/src/controllers/dispositivosController.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { CONFIRMED_STATUSES } from '../utils/statusHelpers';

const prisma = new PrismaClient();

/**
 * @route GET /api/dispositivos
 * @description Obtiene una lista de todos los dispositivos, con filtros opcionales.
 */
export const getAllDispositivos = async (req: Request, res: Response) => {
    const { search } = req.query;

    let whereClause: Prisma.DispositivosWhereInput = {};
    
    if (search && typeof search === 'string' && search.trim() !== '') {
        const isNumeric = !isNaN(Number(search));
        
        // --- CORRECCIÓN ERROR 2: Inicializar OR como un array vacío ---
        whereClause.OR = [
            // --- CORRECCIÓN ERROR 1: Eliminar `mode: 'insensitive'` ---
            { patente: { contains: search } },
        ];

        if (isNumeric) {
            // Ahora es seguro usar push
            whereClause.OR.push({ nroInterno: { equals: Number(search) } });
        }
    }
    
    try {
        const dispositivos = await prisma.dispositivos.findMany({
            where: whereClause,
            orderBy: { nroInterno: 'asc' },
            include: {
                _count: {
                    select: { alarmas: true },
                },
            },
        });
        
        const response = dispositivos.map(d => ({
            id: d.id,
            idDispositivo: d.idDispositivo,
            nroInterno: d.nroInterno,
            patente: d.patente,
            sim: d.sim,
            totalAlarmas: d._count.alarmas,
        }));
        
        res.status(200).json(response);
    } catch (error) {
        console.error("Error al obtener la lista de dispositivos:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @route GET /api/dispositivos/:id
 * @description Obtiene detalles y estadísticas de un dispositivo específico.
 */
export const getDispositivoByIdWithStats = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dispositivoId = parseInt(id, 10);

    if (isNaN(dispositivoId)) {
        return res.status(400).json({ message: 'El ID del dispositivo debe ser un número.' });
    }

    try {
        const dispositivo = await prisma.dispositivos.findUnique({
            where: { idDispositivo: dispositivoId },
        });

        if (!dispositivo) {
            return res.status(404).json({ message: 'Dispositivo no encontrado.' });
        }

        const [
            totalAlarms, 
            totalAlarmsConfirmed,
            alarmsByWeekday, 
            topAlarmTypes
        ] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { dispositivo: dispositivoId } }),
            prisma.alarmasHistorico.count({ where: { dispositivo: dispositivoId, estado: { in: CONFIRMED_STATUSES } } }),
            prisma.$queryRaw`
                SELECT 
                    DATENAME(weekday, alarmTime) as dayName,
                    DATEPART(weekday, alarmTime) as dayOfWeek,
                    COUNT(*) as total
                FROM alarmas.alarmasHistorico
                WHERE dispositivo = ${dispositivoId}
                GROUP BY DATENAME(weekday, alarmTime), DATEPART(weekday, alarmTime)
                ORDER BY dayOfWeek ASC;
            `,
            prisma.alarmasHistorico.groupBy({
                by: ['alarmTypeId'],
                where: { dispositivo: dispositivoId, alarmTypeId: { not: null } },
                _count: {
                    alarmTypeId: true,
                },
                orderBy: {
                    _count: {
                        alarmTypeId: 'desc',
                    },
                },
                take: 5,
            }),
        ]);

        const typeIds = topAlarmTypes.map(t => t.alarmTypeId as number);
        const typeDetails = await prisma.typeAlarms.findMany({
            where: { type: { in: typeIds } },
        });
        const typeMap = new Map(typeDetails.map(t => [t.type, t.alarm]));

        const topAlarmTypesProcessed = topAlarmTypes.map(t => ({
            name: typeMap.get(t.alarmTypeId as number) || 'Desconocido',
            count: t._count.alarmTypeId,
        }));

        const responsePayload = {
            ...dispositivo,
            stats: {
                totalAlarms,
                totalAlarmsConfirmed,
                alarmsByWeekday: (alarmsByWeekday as any[]).map(d => ({...d, total: Number(d.total)}))
            },
            topAlarmTypes: topAlarmTypesProcessed
        };
        
        res.status(200).json(responsePayload);
    } catch (error) {
        console.error(`Error al obtener detalles del dispositivo ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};