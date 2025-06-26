"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/alarmas.ts
const express_1 = require("express");
const alarmaController_1 = require("../controllers/alarmaController");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    await (0, alarmaController_1.getAllAlarms)(req, res);
});
router.get('/count', async (req, res) => {
    await (0, alarmaController_1.getAlarmsCount)(req, res);
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
router.put('/:id/undo', async (req, res) => {
    await (0, alarmaController_1.undoAlarmAction)(req, res);
});
router.post('/:id/retry-video', async (req, res) => {
    await (0, alarmaController_1.retryVideoDownload)(req, res);
});
router.patch('/:id/assign-driver', async (req, res) => {
    await (0, alarmaController_1.assignDriverToAlarm)(req, res);
});
exports.default = router;
