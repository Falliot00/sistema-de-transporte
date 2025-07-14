// backend/src/types/express.d.ts
// Extensión de tipos para Express

import { Request as ExpressRequest } from 'express';

declare module 'express' {
  export interface Request extends ExpressRequest {
    // Aquí puedes agregar propiedades personalizadas si las necesitas
  }
}