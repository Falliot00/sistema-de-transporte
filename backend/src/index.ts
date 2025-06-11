// backend/src/index.ts

console.log("1. Iniciando la aplicación...");

import express from 'express';
import cors from 'cors';
import { config } from './config';
import alarmasRouter from './routes/alarmas';

console.log("2. Módulos importados correctamente.");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

console.log("3. Middlewares de Express configurados.");

// Rutas
app.get('/api', (req, res) => {
  res.send('API del Sistema de Transporte funcionando!');
});

app.use('/api/alarmas', alarmasRouter);

console.log("4. Rutas configuradas.");

// Iniciar el servidor
app.listen(config.port, () => {
  // Este es el mensaje que no estás viendo
  console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
});

console.log("5. Se ha llamado a app.listen(). Esperando conexión...");