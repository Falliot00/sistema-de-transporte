// backend/src/index.ts

console.log("1. Iniciando la aplicación...");

import express from 'express';
import cors from 'cors';
import { config } from './config';
import alarmasRouter from './routes/alarmas';
import choferesRouter from './routes/choferes';
import dashboardRouter from './routes/dashboard'; // <-- NUEVA IMPORTACIÓN

console.log("2. Módulos importados correctamente.");

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // <-- En producción podés usar: 'http://190.183.146.107'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

console.log("3. Middlewares de Express configurados.");

// Rutas
app.get('/api', (req, res) => {
  res.send('API del Sistema de Transporte funcionando!');
});

app.use('/api/alarmas', alarmasRouter);
app.use('/api/choferes', choferesRouter);
app.use('/api/dashboard', dashboardRouter); // <-- NUEVA RUTA

console.log("4. Rutas configuradas.");

// Iniciar el servidor
app.listen(config.port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
});

console.log("5. Se ha llamado a app.listen(). Esperando conexión...");
