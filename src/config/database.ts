import { PrismaClient } from '@prisma/client';

// Настройка Prisma Client для работы с Supabase Pooler
// Ограничиваем количество подключений для Supabase free tier
// Session Pooler поддерживает только 1-4 подключения одновременно
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Ограничиваем пул подключений для Supabase
// Используем connection_limit через URL параметр в DATABASE_URL
// Или через Prisma connection pool settings
export default prisma;
