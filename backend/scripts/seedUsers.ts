import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'admin', password: 'admin123', role: Role.ADMIN },
    { username: 'user1', password: 'password1', role: Role.USER },
    { username: 'user2', password: 'password2', role: Role.USER },
    { username: 'user3', password: 'password3', role: Role.USER },
    { username: 'user4', password: 'password4', role: Role.USER },
    { username: 'user5', password: 'password5', role: Role.USER },
    { username: 'user6', password: 'password6', role: Role.USER },
    { username: 'user7', password: 'password7', role: Role.USER },
    { username: 'user8', password: 'password8', role: Role.USER },
    { username: 'user9', password: 'password9', role: Role.USER }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        password: hashedPassword,
        role: user.role
      }
    });
  }

  console.log('✅ Usuarios iniciales insertados');
}

main()
  .catch((e) => {
    console.error('❌ Error al insertar usuarios:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
