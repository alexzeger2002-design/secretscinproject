// Обновление пароля админа с правильным хешем
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Получаем прямой URL для БД (без Pooler)
function getDirectDatabaseUrl() {
  let dbUrl = process.env.DATABASE_URL || '';
  
  if (dbUrl.includes('pooler.supabase.com')) {
    // Заменяем pooler на прямой доступ
    dbUrl = dbUrl
      .replace('pooler.supabase.com:5432', 'db.supabase.co:5432')
      .replace('pooler.supabase.com:6543', 'db.supabase.co:5432')
      .replace('postgres.hjeinrfkdoensatewfud', 'postgres') // Убираем project_id для прямого подключения
      .replace('?pgbouncer=true', '')
      .replace('&pgbouncer=true', '')
      .replace('&connection_limit=1', '')
      .replace('?connection_limit=1', '');
  }
  
  return dbUrl;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDirectDatabaseUrl(),
    },
  },
});

async function updatePassword() {
  try {
    const username = 'Eldar232382193';
    const password = 'ASHcboq12huhe12';
    
    console.log('🔐 Генерация правильного хеша для пароля...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Хеш сгенерирован:', hashedPassword.substring(0, 30) + '...\n');
    
    console.log('👤 Обновление пароля админа...');
    
    // Обновляем пароль через raw SQL
    await prisma.$executeRaw`
      UPDATE "AdminUser" 
      SET password = ${hashedPassword}, "updatedAt" = NOW()
      WHERE username = ${username}
    `;
    
    console.log('✅ Пароль обновлен!\n');
    
    // Проверяем результат
    const admin = await prisma.$queryRaw`
      SELECT username, "isActive", password
      FROM "AdminUser" 
      WHERE username = ${username}
    `;
    
    if (admin[0]) {
      console.log('✅ Админ найден:');
      console.log(`   Username: ${admin[0].username}`);
      console.log(`   IsActive: ${admin[0].isActive}`);
      console.log(`   Hash: ${admin[0].password.substring(0, 30)}...\n`);
      
      // Проверяем что пароль правильный с реальным хешем из БД
      const finalCheck = await bcrypt.compare(password, admin[0].password);
      console.log(`🔐 Проверка пароля: ${finalCheck ? '✅ РАБОТАЕТ' : '❌ НЕ РАБОТАЕТ'}\n`);
      
      if (finalCheck) {
        console.log('🎉 ВСЕ ГОТОВО! Теперь можно войти:');
        console.log('   Логин: Eldar232382193');
        console.log('   Пароль: ASHcboq12huhe12');
      }
    } else {
      console.log('❌ Админ не найден! Создаем нового...\n');
      
      // Создаем админа если его нет
      await prisma.$executeRaw`
        INSERT INTO "AdminUser" (username, password, "isActive", "createdAt", "updatedAt")
        VALUES (${username}, ${hashedPassword}, true, NOW(), NOW())
      `;
      
      console.log('✅ Админ создан!');
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

updatePassword();
