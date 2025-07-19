// backend/src/routes/anomalias.ts
import { Router, Request, Response } from 'express';
import { getAllAnomalias } from '../controllers/anomaliasController';

const router = Router();

// Ruta para obtener todas las anomalías
router.get('/', async (req: Request, res: Response) => {
    await getAllAnomalias(req, res);
});

export default router;