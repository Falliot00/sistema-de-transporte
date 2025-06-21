// backend/src/controllers/choferesController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @route GET /api/choferes
 * @description Obtiene una lista de todos los choferes.
 * @access Public (en un entorno real, debería ser protegido)
 */
export const getAllChoferes = async (req: Request, res: Response) => {
    try {
        const choferes = await prisma.choferes.findMany({
            orderBy: {
                apellido: 'asc',
            },
        });
        res.status(200).json(choferes);
    } catch (error) {
        console.error("Error al obtener la lista de choferes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};