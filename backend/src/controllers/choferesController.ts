// backend/src/controllers/choferesController.ts
import { Request, Response } from 'express';
import { PrismaClient, Choferes } from '@prisma/client';
// SOLUCIÓN: Importamos las funciones desde el archivo central de transformers
import { transformAlarmData, getEmpresaNameFromId } from '../utils/transformers';

const prisma = new PrismaClient();

const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

/**
 * @route GET /api/choferes
 * @description Obtiene una lista de todos los choferes, filtrando por el sector "CHOFERES".
 */
export const getAllChoferes = async (req: Request, res: Response) => {
    const { search } = req.query;
    let searchFilter: any = {};

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
                ...searchFilter,
            },
            orderBy: [{ apellido_nombre: 'asc' }],
        });
        
        const choferes = choferesFromDb.map((chofer: Choferes) => {
            const apellidoNombre = chofer.apellido_nombre || '';
            const parts = apellidoNombre.includes(',') 
                ? apellidoNombre.split(',').map((s: string) => s.trim())
                : apellidoNombre.split(' ');
            
            const apellido = parts[0] || '';
            const nombre = parts.slice(1).join(' ') || '';
            
            return {
                choferes_id: chofer.choferes_id,
                nombre: nombre || apellidoNombre,
                apellido: apellido,
                foto: chofer.foto,
                dni: chofer.dni,
                anios: chofer.anios,
                empresa: getEmpresaNameFromId(chofer.idEmpresa),
                estado: chofer.estado,
                sector: chofer.sector,
                puesto: chofer.puesto,
            };
        });
        
        res.status(200).json(choferes);
    } catch (error) {
        console.error("Error al obtener la lista de choferes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @route GET /api/choferes/:id
 * @description Obtiene detalles y estadísticas de un chofer.
 */
export const getDriverByIdWithStats = async (req: Request, res: Response) => {
    const { id } = req.params;
    const driverId = parseInt(id, 10);

    if (isNaN(driverId)) {
        return res.status(400).json({ message: 'El ID del chofer debe ser un número.' });
    }

    try {
        const driver = await prisma.choferes.findUnique({
            where: { choferes_id: driverId }, 
            include: {
                alarmas: { 
                    take: 10,
                    orderBy: { alarmTime: 'desc' },
                    include: { typeAlarm: true, chofer: true } 
                }
            }
        });

        if (!driver) {
            return res.status(404).json({ message: 'Chofer no encontrado.' });
        }
        
        if (driver.sector !== 'CHOFERES') {
            return res.status(404).json({ message: 'El empleado solicitado no es un chofer.' });
        }

        const [totalAlarms, pendingAlarms, suspiciousAlarms, confirmedAlarms, rejectedAlarms] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { choferId: driverId } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.pending } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.suspicious } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.confirmed } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.rejected } } }),
        ]);

        const recentAlarmsTransformed = driver.alarmas.map(transformAlarmData);
        
        const apellidoNombre = driver.apellido_nombre || '';
        const parts = apellidoNombre.includes(',') 
            ? apellidoNombre.split(',').map((s: string) => s.trim())
            : apellidoNombre.split(' ');
        
        const apellido = parts[0] || '';
        const nombre = parts.slice(1).join(' ') || '';
        
        const responsePayload = {
            choferes_id: driver.choferes_id,
            nombre: nombre,
            apellido: apellido,
            foto: driver.foto,
            dni: driver.dni,
            anios: driver.anios,
            empresa: getEmpresaNameFromId(driver.idEmpresa),
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