"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/dashboard.ts
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
// Ruta para obtener todos los datos agregados para la pestaña de resumen del dashboard.
router.get('/summary', async (req, res) => {
    await (0, dashboardController_1.getSummary)(req, res);
});
exports.default = router;
