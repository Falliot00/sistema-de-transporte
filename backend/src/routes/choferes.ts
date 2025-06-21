// backend/src/routes/choferes.ts
import { Router, Request, Response } from 'express';
import { getAllChoferes, getDriverByIdWithStats } from '../controllers/choferesController';

const router = Router();

// Ruta para obtener todos los choferes
router.get('/', async (req: Request, res: Response) => {
    await getAllChoferes(req, res);
});

// NUEVA RUTA: para obtener un chofer por su ID con estadísticas
router.get('/:id', async (req: Request, res: Response) => {
    await getDriverByIdWithStats(req, res);
});

export default router;