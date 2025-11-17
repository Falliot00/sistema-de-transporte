import { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { resolveRoleFromGroups } from '../utils/ssoRoleMapper';

const prisma = new PrismaClient();
const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';

/*const dlog = (...args: any[]) => {
  if (DEBUG_AUTH) console.log('[auth.debug]', ...args);
};*/

export const login: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      res.status(400).json({ message: 'username y password son requeridos' });
      return;
    }

    //dlog('Intento de login', { username });
    // Usamos findFirst por compatibilidad si la tabla existente no tiene índice único
    const user = await prisma.user.findFirst({ where: { username } });
    //dlog('Usuario encontrado?', !!user, user ? { id: user.id, role: user.role, hashPrefix: user.password?.slice(0,4) } : {});
    if (!user) {
      //dlog('Fallo: usuario no existe');
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const ok = await bcrypt.compare(password, user.password);
    //dlog('Resultado bcrypt.compare', ok);
    if (!ok) {
      //dlog('Fallo: contraseña incorrecta');
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      secret,
      { expiresIn: '8h' }
    );

    //dlog('Login OK para', { id: user.id, username: user.username, role: user.role });
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
    return;
  } catch (err) {
    console.error('[auth.login] error:', err);
    res.status(500).json({ message: 'Error interno' });
    return;
  }
};

const SHARED_SSO_SECRET = process.env.INTERNAL_SSO_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function parseGroups(payloadGroups: unknown): string[] {
  if (!payloadGroups) return [];
  if (Array.isArray(payloadGroups)) {
    return payloadGroups
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof payloadGroups === 'string') {
    try {
      const maybeJson = JSON.parse(payloadGroups);
      if (Array.isArray(maybeJson)) {
        return maybeJson
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean);
      }
    } catch {
      // No es JSON, continuamos con split
    }
    return payloadGroups
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export const ssoLogin: RequestHandler = async (req, res) => {
  try {
    if (!SHARED_SSO_SECRET) {
      res.status(503).json({ message: 'SSO no est�� configurado en el backend.' });
      return;
    }

    const providedSecret = req.headers['x-internal-sso-secret'];
    if (providedSecret !== SHARED_SSO_SECRET) {
      res.status(403).json({ message: 'No autorizado para realizar intercambio SSO.' });
      return;
    }

    const { username, email, name, groups } = req.body ?? {};
    if (!username || typeof username !== 'string') {
      res.status(400).json({ message: 'username es requerido para el intercambio SSO.' });
      return;
    }

    const normalizedGroups = parseGroups(groups);
    let role = 'USER';
    try {
      role = resolveRoleFromGroups(normalizedGroups);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Usuario sin permisos';
      res.status(403).json({ message });
      return;
    }

    const token = jwt.sign(
      {
        sub: username,
        username,
        email: typeof email === 'string' ? email : undefined,
        name: typeof name === 'string' ? name : undefined,
        role,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        username,
        email,
        role,
        groups: normalizedGroups,
      },
    });
  } catch (error) {
    console.error('[auth.ssoLogin] error:', error);
    res.status(500).json({ message: 'Error interno al intercambiar credenciales SSO.' });
  }
};
