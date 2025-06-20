// backend/src/routes/alarmas.ts
import { Router, Request, Response } from 'express';
// --- INICIO DE LA SOLUCIÓN: Importar nuevo controlador ---
import { getAllAlarms, getAlarmById, reviewAlarm, confirmFinalAlarm, reEvaluateAlarm, retryVideoDownload } from '../controllers/alarmaController';
// --- FIN DE LA SOLUCIÓN ---

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    await getAllAlarms(req, res);
});

router.get('/:id', async (req: Request, res: Response) => {
    await getAlarmById(req, res);
});

router.put('/:id/review', async (req: Request, res: Response) => {
    await reviewAlarm(req, res);
});

router.put('/:id/confirm', async (req: Request, res: Response) => {
    await confirmFinalAlarm(req, res);
});

router.put('/:id/re-evaluate', async (req: Request, res: Response) => {
    await reEvaluateAlarm(req, res);
});

// --- INICIO DE LA SOLUCIÓN: Nueva ruta POST para reintentar ---
router.post('/:id/retry-video', async (req: Request, res: Response) => {
    await retryVideoDownload(req, res);
});
// --- FIN DE LA SOLUCIÓN ---


export default router;