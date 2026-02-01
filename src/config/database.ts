import { PrismaClient } from '@prisma/client';

// Настройка Prisma Client для работы с Supabase Pooler
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
