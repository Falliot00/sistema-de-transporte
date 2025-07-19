// backend/src/controllers/anomaliasController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtiene todas las anomalías disponibles
 */
export const getAllAnomalias = async (req: Request, res: Response) => {
    try {
        const anomalias = await prisma.anomalia.findMany({
            orderBy: {
                nomAnomalia: 'asc'
            }
        });

        console.log('Anomalías encontradas:', anomalias.length);
        res.status(200).json(anomalias);
    } catch (error) {
        console.error("Error al obtener las anomalías:", error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las anomalías.' });
    }
};