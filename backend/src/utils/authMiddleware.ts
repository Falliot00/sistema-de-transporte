import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  sub: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateToken: RequestHandler = (req, res, next) => {
  try {
    const auth = req.headers['authorization'];
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) {
      res.status(401).json({ message: 'Token requerido' });
      return;
    }
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as AuthUser;
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

export const authorizeRoles = (...roles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'No autorizado' });
      return;
    }
    next();
  };
};

