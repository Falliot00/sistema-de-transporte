// backend/src/routes/choferes.ts
import { Router } from 'express';
import { getAllChoferes } from '../controllers/choferesController';

const router = Router();

// Define la ruta para obtener todos los choferes
router.get('/', getAllChoferes);

export default router;