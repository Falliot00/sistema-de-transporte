// backend/src/routes/anomalias.ts
import { Router, Request, Response } from 'express';
import { getAllAnomalias } from '../controllers/anomaliasController';
import { authenticateToken } from '../utils/authMiddleware';

const router = Router();

// Ruta para obtener todas las anomalías
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    await getAllAnomalias(req, res);
});

export default router;
