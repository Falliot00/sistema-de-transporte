// backend/src/controllers/choferesController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
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
    const { search } = req.query;
    let searchFilter = {};

    if (search && typeof search === 'string') {
        searchFilter = {
            OR: [
                { apellido_nombre: { contains: search } },
                { dni: { contains: search } },
            ],
        };
    }

    try {
        const choferesFromDb = await prisma.choferes.findMany({
            where: {
                sector: 'CHOFERES',
                estado: 'A',
                liquidacionEstado: 'A',
                ...searchFilter,
            },
            orderBy: [{ apellido_nombre: 'asc' }],
            include: {
                empresaInfo: true, // Incluir la relación con la empresa
            }
        });
        
        const choferes = choferesFromDb.map((chofer: any) => ({
            choferes_id: chofer.choferes_id,
            apellido_nombre: chofer.apellido_nombre,
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
                empresaInfo: true, // Incluir info de la empresa del chofer
                alarmas: { 
                    take: 10,
                    orderBy: { alarmTime: 'desc' },
                    include: alarmIncludesForDriverDetails
                }
            }
        });

        if (!driver) {
            return res.status(404).json({ message: 'Chofer no encontrado o inactivo.' });
        }

        const [totalAlarms, pendingAlarms, suspiciousAlarms, confirmedAlarms, rejectedAlarms] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { choferId: driverId } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.pending } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.suspicious } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.confirmed } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.rejected } } }),
        ]);

        const recentAlarmsTransformed = driver.alarmas.map(alarm => transformAlarmData({ ...alarm, chofer: driver }));
        
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