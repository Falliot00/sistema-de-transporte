// backend/scripts/seedUsers.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type UserRole = 'ADMIN' | 'USER' | 'MANAGER';

type SeedUser = {
  username: string;
  role: UserRole;
  password: string; // plain text to be hashed
};

// Usuarios base (puedes ajustar nombres y roles)
const seedUsers: SeedUser[] = [
  { username: 'Fermin',   role: 'ADMIN',   password: 'fermin050600' },
  { username: 'Lorenzo', role: 'MANAGER', password: 'lorenzo311295' },
  { username: 'Andres',   role: 'USER',    password: 'taller6558' }
];

export async function seedUsersIfNeeded() {
  // Crea usuarios si no existen y corrige contraseñas/roles si ya existen.
  for (const u of seedUsers) {
    const existing = await prisma.user.findFirst({ where: { username: u.username } });
    const hashed = await bcrypt.hash(u.password, 10);

    if (!existing) {
      await prisma.user.create({
        data: { username: u.username, password: hashed, role: u.role },
      });
      console.log(`[seedUsers] Usuario creado: ${u.username} (${u.role})`);
      continue;
    }

    // Si existe, aseguramos rol y contraseña bcrypt (empieza con $2a/2b/2y)
    const isBcrypt = typeof existing.password === 'string' && /^\$2[aby]\$/.test(existing.password);
    const needsPasswordUpdate = !isBcrypt;
    const needsRoleUpdate = existing.role !== u.role;

    if (needsPasswordUpdate || needsRoleUpdate) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: needsPasswordUpdate ? hashed : existing.password,
          role: needsRoleUpdate ? u.role : existing.role,
        },
      });
      console.log(`[seedUsers] Usuario actualizado: ${u.username} ${needsPasswordUpdate ? '[password]' : ''} ${needsRoleUpdate ? '[role]' : ''}`.trim());
    }
  }
}

// Permite ejecutar manualmente: `ts-node scripts/seedUsers.ts`
if (require.main === module) {
  seedUsersIfNeeded()
    .catch((e) => {
      console.error('[seedUsers] Error:', e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
