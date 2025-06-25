// backend/src/routes/alarmas.ts
import { Router, Request, Response } from 'express';
import { getAllAlarms, getAlarmById, reviewAlarm, confirmFinalAlarm, reEvaluateAlarm, retryVideoDownload, assignDriverToAlarm, getAlarmsCount } from '../controllers/alarmaController';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    await getAllAlarms(req, res);
});


router.get('/count', async (req: Request, res: Response) => {
    await getAlarmsCount(req, res);
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

router.post('/:id/retry-video', async (req: Request, res: Response) => {
    await retryVideoDownload(req, res);
});

router.patch('/:id/assign-driver', async (req: Request, res: Response) => {
    await assignDriverToAlarm(req, res);
});

export default router;