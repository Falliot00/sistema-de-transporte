import { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
