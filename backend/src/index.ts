// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { config } from './config';
import alarmasRouter from './routes/alarmas';
import choferesRouter from './routes/choferes';
import dashboardRouter from './routes/dashboard';
import dispositivosRouter from './routes/dispositivos';
import anomaliasRouter from './routes/anomalias';
import { seedUsersIfNeeded } from '../scripts/seedUsers';
import authRouter from './routes/auth';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rutas
app.get('/api', (_req, res) => {
  res.send('API del Sistema de Transporte funcionando!');
});

app.use('/api/alarmas', alarmasRouter);
app.use('/api/choferes', choferesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dispositivos', dispositivosRouter);
app.use('/api/anomalias', anomaliasRouter);
app.use('/api/auth', authRouter);

// Ejecutar semillas y luego iniciar el servidor
async function bootstrap() {
  try {
    await seedUsersIfNeeded();
  } catch (err) {
    console.error('[bootstrap] Error al sembrar usuarios:', err);
  }

  app.listen(config.port, () => {
    console.log(`Servidor corriendo en http://localhost:${config.port}`);
  });
}

bootstrap();
