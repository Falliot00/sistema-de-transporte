import { Router } from 'express';
import { getAllAlarms, getAlarmById, reviewAlarm } from '../controllers/alarmaController';

const router = Router();

// Endpoint para obtener todas las alarmas
// GET /api/alarmas
router.get('/', getAllAlarms);

// Endpoint para obtener una alarma específica por su ID (guid)
// GET /api/alarmas/some-guid-123
router.get('/:id', getAlarmById);

// Endpoint para actualizar el estado de una alarma (confirmar/rechazar)
// PUT /api/alarmas/some-guid-123/review
router.put('/:id/review', reviewAlarm);

export default router;