// backend/src/routes/alarmas.ts (SIN CAMBIOS)
import { Router } from 'express';
import { getAllAlarms, getAlarmById, reviewAlarm, getPendingAlarms } from '../controllers/alarmaController';

const router = Router();

// Este endpoint ahora es mucho más potente.
router.get('/', getAllAlarms);

// Endpoint para el modo análisis (se mantiene)
router.get('/pending', getPendingAlarms);

// Endpoints de detalle y revisión (se mantienen)
router.get('/:id', getAlarmById);
router.put('/:id/review', reviewAlarm);

export default router;