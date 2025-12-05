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
    updateAlarmAnomaly,
    markAlarmAsReported,
    generateAlarmReport
} from '../controllers/alarmaController';
import { manualRetryCheck, getRetryStats, resetAlarmRetryCount } from '../services/videoRetryService';

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

// Ruta para marcar una alarma como informada
router.patch('/:id/report', authenticateToken, authorizeRoles('ADMIN','MANAGER','OPERADOR'), async (req: Request, res: Response) => {
    await markAlarmAsReported(req, res);
});

// Ruta para generar informe de múltiples alarmas
router.post('/generate-report', authenticateToken, authorizeRoles('ADMIN','MANAGER','OPERADOR'), async (req: Request, res: Response) => {
    await generateAlarmReport(req, res);
});

// Ruta para ejecutar manualmente el chequeo de reintentos de video (solo para ADMIN)
router.post('/check-video-retries', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
    try {
        await manualRetryCheck();
        res.status(200).json({ message: 'Chequeo de reintentos de video ejecutado exitosamente.' });
    } catch (error) {
        console.error('Error al ejecutar chequeo manual de reintentos:', error);
        res.status(500).json({ message: 'Error al ejecutar el chequeo de reintentos.' });
    }
});

// Ruta para obtener estadísticas de reintentos de video (solo para ADMIN)
router.get('/video-retry-stats', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
    try {
        const stats = getRetryStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas de reintentos:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas.' });
    }
});

// Ruta para reiniciar el contador de reintentos de una alarma específica (solo para ADMIN)
router.post('/:id/reset-retry-count', authenticateToken, authorizeRoles('ADMIN'), async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const success = resetAlarmRetryCount(id);
        if (success) {
            res.status(200).json({ message: `Contador de reintentos reiniciado para la alarma ${id}.` });
        } else {
            res.status(404).json({ message: 'La alarma no tiene reintentos registrados.' });
        }
    } catch (error) {
        console.error('Error al reiniciar contador de reintentos:', error);
        res.status(500).json({ message: 'Error al reiniciar el contador.' });
    }
});

export default router;
