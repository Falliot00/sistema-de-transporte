// backend/src/routes/dashboard.ts
import { Router, Request, Response } from 'express';
import { getSummary } from '../controllers/dashboardController';

const router = Router();

// Ruta para obtener todos los datos agregados para la pestaña de resumen del dashboard.
router.get('/summary', async (req: Request, res: Response) => {
    await getSummary(req, res);
});

export default router;