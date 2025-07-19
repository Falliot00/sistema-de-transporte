// backend/src/routes/dispositivos.ts
import { Router, Request, Response } from 'express'; // <-- Importar Request y Response
import { getAllDispositivos, getDispositivoByIdWithStats } from '../controllers/dispositivosController';

const router = Router();

// Ruta para obtener todos los dispositivos (lista)
// --- CORRECCIÓN: Envolver la llamada en una función de flecha asíncrona ---
router.get('/', async (req: Request, res: Response) => {
    await getAllDispositivos(req, res);
});

// Ruta para obtener un dispositivo por su ID con estadísticas (detalle)
// --- CORRECCIÓN: Envolver la llamada en una función de flecha asíncrona ---
router.get('/:id', async (req: Request, res: Response) => {
    await getDispositivoByIdWithStats(req, res);
});

export default router;