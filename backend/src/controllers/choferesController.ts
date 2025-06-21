// backend/src/controllers/choferesController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// El mapa de estados se mantiene para consistencia en las estadísticas.
const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};

/**
 * @route GET /api/choferes
 * @description Obtiene una lista de todos los choferes.
 * @access Public (SECURITY: En un entorno real, debería ser protegido por autenticación)
 */
export const getAllChoferes = async (req: Request, res: Response) => {
    try {
        const choferes = await prisma.choferes.findMany({
            orderBy: [
                { nombre: 'asc' },
                { apellido: 'asc' },
            ],
        });
        res.status(200).json(choferes);
    } catch (error) {
        console.error("Error al obtener la lista de choferes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * @route GET /api/choferes/:id
 * @description Obtiene los detalles de un chofer específico junto con sus estadísticas de alarmas.
 * @access Public (SECURITY: Debería ser protegido)
 */
export const getDriverByIdWithStats = async (req: Request, res: Response) => {
    const { id } = req.params;
    const driverId = parseInt(id, 10);

    // SECURITY CHECK: Asegurarse de que el ID es un número válido.
    if (isNaN(driverId)) {
        return res.status(400).json({ message: 'El ID del chofer debe ser un número.' });
    }

    try {
        const driver = await prisma.choferes.findUnique({
            where: { choferes_id: driverId },
        });

        if (!driver) {
            return res.status(404).json({ message: 'Chofer no encontrado.' });
        }

        // Se realizan las consultas de conteo de forma paralela para mayor eficiencia.
        const [
            totalAlarms,
            pendingAlarms,
            suspiciousAlarms,
            confirmedAlarms,
            rejectedAlarms
        ] = await Promise.all([
            prisma.alarmasHistorico.count({ where: { choferId: driverId } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.pending } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.suspicious } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.confirmed } } }),
            prisma.alarmasHistorico.count({ where: { choferId: driverId, estado: { in: DB_QUERY_STATUS_MAP.rejected } } }),
        ]);

        const responsePayload = {
            ...driver,
            stats: {
                total: totalAlarms,
                pending: pendingAlarms,
                suspicious: suspiciousAlarms,
                confirmed: confirmedAlarms,
                rejected: rejectedAlarms,
            }
        };

        res.status(200).json(responsePayload);

    } catch (error) {
        console.error(`Error al obtener detalles del chofer ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};