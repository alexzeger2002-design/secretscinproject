// Проверка существования админа в БД
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Используем URL из .env, но переключаемся на Transaction Pooler если нужно
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL не найден в .env!');
  process.exit(1);
}

// Используем Transaction Pooler (6543) вместо Session Pooler (5432)
if (dbUrl.includes('pooler.supabase.com:5432')) {
  dbUrl = dbUrl.replace(':5432', ':6543');
  console.log('⚠️  Используем Transaction Pooler (порт 6543) вместо Session Pooler\n');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function checkAdmin() {
  try {
    console.log('🔍 Проверка админа в БД...\n');
    
    await prisma.$connect();
    console.log('✅ Подключение к БД установлено\n');
    
    // Проверяем всех админов
    const allAdmins = await prisma.$queryRaw`
      SELECT id, username, "isActive", LEFT(password, 30) as hash_start, "createdAt"
      FROM "AdminUser"
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`📊 Найдено админов: ${allAdmins.length}\n`);
    
    if (allAdmins.length === 0) {
      console.log('❌ АДМИНОВ НЕТ В БД!');
      console.log('\n💡 Нужно создать админа через:');
      console.log('   node scripts/testConnection.js');
      return;
    }
    
    // Ищем конкретного админа
    const targetAdmin = await prisma.$queryRaw`
      SELECT id, username, "isActive", password, "createdAt"
      FROM "AdminUser"
      WHERE username = 'Eldar232382193'
      LIMIT 1
    `;
    
    if (targetAdmin.length === 0) {
      console.log('❌ Админ "Eldar232382193" НЕ НАЙДЕН!\n');
      console.log('📋 Все админы в БД:');
      allAdmins.forEach((admin, idx) => {
        console.log(`   ${idx + 1}. ${admin.username} (ID: ${admin.id}, Active: ${admin.isActive})`);
      });
    } else {
      const admin = targetAdmin[0];
      console.log('✅ Админ найден:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   IsActive: ${admin.isActive}`);
      console.log(`   Hash: ${admin.password.substring(0, 30)}...`);
      console.log(`   Created: ${admin.createdAt}\n`);
      
      // Проверяем длину хеша
      if (admin.password.length < 50) {
        console.log('⚠️  ВНИМАНИЕ: Хеш слишком короткий! Должен быть ~60 символов');
        console.log('   Возможно, пароль не захеширован правильно\n');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    if (error.message.includes('Can\'t reach')) {
      console.error('\n💡 Проблема с подключением к БД!');
      console.error('   Проверьте DATABASE_URL в .env');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
