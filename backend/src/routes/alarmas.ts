// backend/src/routes/alarmas.ts
import { Router, Request, Response, RequestHandler } from 'express'; // Importar RequestHandler
import { getAllAlarms, getAlarmById, reviewAlarm, confirmFinalAlarm } from '../controllers/alarmaController';

const router = Router();

// Endpoint para obtener todas las alarmas
// FIX: Envolver el controlador en una función async para asegurar la firma correcta
router.get('/', async (req: Request, res: Response) => {
    await getAllAlarms(req, res);
});

// Endpoint para obtener una alarma específica por su ID
// FIX: Envolver el controlador en una función async para asegurar la firma correcta
router.get('/:id', async (req: Request, res: Response) => {
    await getAlarmById(req, res);
});

// Endpoint para la PRIMERA revisión (Pendiente -> Sospechosa o Rechazada)
// FIX: Envolver el controlador en una función async para asegurar la firma correcta
router.put('/:id/review', async (req: Request, res: Response) => {
    await reviewAlarm(req, res);
});

// NUEVO Endpoint para la confirmación FINAL (Sospechosa -> Confirmada)
// FIX: Envolver el controlador en una función async para asegurar la firma correcta
router.put('/:id/confirm', async (req: Request, res: Response) => {
    await confirmFinalAlarm(req, res);
});

export default router;