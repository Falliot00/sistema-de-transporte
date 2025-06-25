"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/alarmas.ts
const express_1 = require("express");
// --- INICIO DE LA SOLUCIÓN: Importar nuevo controlador ---
const alarmaController_1 = require("../controllers/alarmaController");
// --- FIN DE LA SOLUCIÓN ---
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    await (0, alarmaController_1.getAllAlarms)(req, res);
});
router.get('/:id', async (req, res) => {
    await (0, alarmaController_1.getAlarmById)(req, res);
});
router.put('/:id/review', async (req, res) => {
    await (0, alarmaController_1.reviewAlarm)(req, res);
});
router.put('/:id/confirm', async (req, res) => {
    await (0, alarmaController_1.confirmFinalAlarm)(req, res);
});
router.put('/:id/re-evaluate', async (req, res) => {
    await (0, alarmaController_1.reEvaluateAlarm)(req, res);
});
router.post('/:id/retry-video', async (req, res) => {
    await (0, alarmaController_1.retryVideoDownload)(req, res);
});
// --- INICIO DE LA SOLUCIÓN: Nueva ruta PATCH para asignar chofer ---
router.patch('/:id/assign-driver', async (req, res) => {
    await (0, alarmaController_1.assignDriverToAlarm)(req, res);
});
// --- FIN DE LA SOLUCIÓN ---
exports.default = router;
