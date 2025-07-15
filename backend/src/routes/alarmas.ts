// backend/src/routes/alarmas.ts
import { Router, Request, Response } from 'express';

import { 
    getAllAlarms, 
    getAlarmById, 
    reviewAlarm, 
    confirmFinalAlarm, 
    reEvaluateAlarm, 
    retryVideoDownload, 
    assignDriverToAlarm, 
    getAlarmsCount,
    undoAlarmAction,
    getAlarmReport
} from '../controllers/alarmaController';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    await getAllAlarms(req, res);
});

router.get('/count', async (req: Request, res: Response) => {
    await getAlarmsCount(req, res);
});

// Es importante que esta ruta con '/reporte' esté ANTES de la ruta genérica '/:id'
// para que no sea interpretada como un ID.
router.get('/:id/reporte', async (req: Request, res: Response) => {
    await getAlarmReport(req, res);
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


router.put('/:id/undo', async (req: Request, res: Response) => {
    await undoAlarmAction(req, res);
});


router.post('/:id/retry-video', async (req: Request, res: Response) => {
    await retryVideoDownload(req, res);
});

router.patch('/:id/assign-driver', async (req: Request, res: Response) => {
    await assignDriverToAlarm(req, res);
});

export default router;