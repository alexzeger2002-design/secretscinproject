import { PrismaClient } from '@prisma/client';

// Прямое подключение к БД (используем тот же URL что и основной, но с fallback)
function getDirectDatabaseUrl(): string {
  return process.env.DATABASE_URL || '';
}

// Prisma Client для прямого подключения (для админа)
export const prismaDirect = new PrismaClient({
  datasources: {
    db: {
      url: getDirectDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prismaDirect;
