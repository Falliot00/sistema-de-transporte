// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { config } from './config';
import alarmasRouter from './routes/alarmas';
import choferesRouter from './routes/choferes';
import dashboardRouter from './routes/dashboard';
import dispositivosRouter from './routes/dispositivos';
import anomaliasRouter from './routes/anomalias';

const app = express();

// Middlewares (sin cambios)
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rutas
app.get('/api', (req, res) => {
  res.send('API del Sistema de Transporte funcionando!');
});

app.use('/api/alarmas', alarmasRouter);
app.use('/api/choferes', choferesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dispositivos', dispositivosRouter);
app.use('/api/anomalias', anomaliasRouter);

// Iniciar el servidor (sin cambios)
app.listen(config.port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
});