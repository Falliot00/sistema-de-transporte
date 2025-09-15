// backend/src/routes/alarmas.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, authorizeRoles, limitUserReview } from '../utils/authMiddleware';

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
    getAlarmReport,
    updateAlarmDescription,
    updateAlarmAnomaly
} from '../controllers/alarmaController';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
    await getAllAlarms(req, res);
});

router.get('/count', authenticateToken, async (req: Request, res: Response) => {
    await getAlarmsCount(req, res);
});

// Es importante que esta ruta con '/reporte' esté ANTES de la ruta genérica '/:id'
// para que no sea interpretada como un ID.
router.get('/:id/reporte', authenticateToken, async (req: Request, res: Response) => {
    await getAlarmReport(req, res);
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    await getAlarmById(req, res);
});

router.put('/:id/review', authenticateToken, authorizeRoles('ADMIN','MANAGER','USER'), limitUserReview, async (req: Request, res: Response) => {
    await reviewAlarm(req, res);
});

router.put('/:id/confirm', authenticateToken, authorizeRoles('ADMIN','MANAGER'), async (req: Request, res: Response) => {
    await confirmFinalAlarm(req, res);
});

router.put('/:id/re-evaluate', authenticateToken, authorizeRoles('ADMIN','MANAGER'), async (req: Request, res: Response) => {
    await reEvaluateAlarm(req, res);
});


router.put('/:id/undo', authenticateToken, authorizeRoles('ADMIN','MANAGER'), async (req: Request, res: Response) => {
    await undoAlarmAction(req, res);
});


router.post('/:id/retry-video', authenticateToken, authorizeRoles('ADMIN','MANAGER'), async (req: Request, res: Response) => {
    await retryVideoDownload(req, res);
});

router.patch('/:id/assign-driver', authenticateToken, authorizeRoles('ADMIN','MANAGER','OPERADOR'), async (req: Request, res: Response) => {
    await assignDriverToAlarm(req, res);
});

router.patch('/:id/description', authenticateToken, authorizeRoles('ADMIN','MANAGER','OPERADOR'), async (req: Request, res: Response) => {
    await updateAlarmDescription(req, res);
});

router.patch('/:id/anomaly', authenticateToken, authorizeRoles('ADMIN','MANAGER','OPERADOR'), async (req: Request, res: Response) => {
    await updateAlarmAnomaly(req, res);
});

export default router;
