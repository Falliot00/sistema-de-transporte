// backend/src/routes/alarmas.ts
import { Router } from 'express';
// --- INICIO DE LA SOLUCIÓN ---
import { getAllAlarms, getAlarmById, reviewAlarm, confirmFinalAlarm } from '../controllers/alarmaController';

const router = Router();

// Endpoint para obtener todas las alarmas (sin cambios en la ruta)
router.get('/', getAllAlarms);

// Endpoint para obtener una alarma específica por su ID (sin cambios en la ruta)
router.get('/:id', getAlarmById);

// Endpoint para la PRIMERA revisión (Pendiente -> Sospechosa o Rechazada)
router.put('/:id/review', reviewAlarm);

// NUEVO Endpoint para la confirmación FINAL (Sospechosa -> Confirmada)
router.put('/:id/confirm', confirmFinalAlarm);

export default router;
// --- FIN DE LA SOLUCIÓN ---