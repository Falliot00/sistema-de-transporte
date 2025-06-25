"use strict";
// backend/src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("1. Iniciando la aplicación...");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const alarmas_1 = __importDefault(require("./routes/alarmas"));
const choferes_1 = __importDefault(require("./routes/choferes"));
const dashboard_1 = __importDefault(require("./routes/dashboard")); // <-- NUEVA IMPORTACIÓN
console.log("2. Módulos importados correctamente.");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({
    origin: '*', // <-- En producción podés usar: 'http://190.183.146.107'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
console.log("3. Middlewares de Express configurados.");
// Rutas
app.get('/api', (req, res) => {
    res.send('API del Sistema de Transporte funcionando!');
});
app.use('/api/alarmas', alarmas_1.default);
app.use('/api/choferes', choferes_1.default);
app.use('/api/dashboard', dashboard_1.default); // <-- NUEVA RUTA
console.log("4. Rutas configuradas.");
// Iniciar el servidor
app.listen(config_1.config.port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${config_1.config.port}`);
});
console.log("5. Se ha llamado a app.listen(). Esperando conexión...");
