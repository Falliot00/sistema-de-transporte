"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/choferes.ts
const express_1 = require("express");
const choferesController_1 = require("../controllers/choferesController");
const router = (0, express_1.Router)();
// Ruta para obtener todos los choferes
router.get('/', async (req, res) => {
    await (0, choferesController_1.getAllChoferes)(req, res);
});
// NUEVA RUTA: para obtener un chofer por su ID con estadísticas
router.get('/:id', async (req, res) => {
    await (0, choferesController_1.getDriverByIdWithStats)(req, res);
});
exports.default = router;
