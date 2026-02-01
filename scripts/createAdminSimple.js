// Простой скрипт для создания администратора
// Использует CommonJS, работает без проблем с импортами

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const username = 'Eldar232382193';
    const password = 'ASHcboq12huhe12';

    console.log('🔗 Подключение к базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение установлено');

    // Проверяем, существует ли пользователь (с обработкой ошибок)
    let existing = null;
    try {
      existing = await prisma.adminUser.findUnique({
        where: { username },
      });
    } catch (error) {
      console.error('Ошибка при поиске админа:', error.message);
      // Пробуем через findMany
      try {
        const admins = await prisma.adminUser.findMany({
          where: { username },
        });
        existing = admins[0] || null;
      } catch (error2) {
        console.error('Ошибка при поиске через findMany:', error2.message);
        throw new Error('Не удалось подключиться к БД. Используйте SQL скрипт: scripts/createAdminDirect.sql');
      }
    }

    if (existing) {
      console.log('❌ Администратор с таким username уже существует!');
      console.log(`   ID: ${existing.id}`);
      await prisma.$disconnect();
      return;
    }

    console.log('🔐 Хеширование пароля...');
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('👤 Создание администратора...');
    // Создаем администратора
    const admin = await prisma.adminUser.create({
      data: {
        username,
        password: hashedPassword,
        email: null,
      },
    });

    console.log('\n✅ Администратор успешно создан!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email || 'не указан'}`);
    console.log(`   Created: ${admin.createdAt}`);
    console.log('\n🎉 Теперь вы можете войти в админ-панель!');
  } catch (error) {
    console.error('\n❌ Ошибка при создании администратора:');
    console.error(error.message);
    if (error.message.includes('Can\'t reach database')) {
      console.error('\n💡 Проверьте:');
      console.error('   1. Правильность DATABASE_URL в .env');
      console.error('   2. Что проект Supabase активен');
      console.error('   3. Что используете правильный порт (5432 для Session Pooler)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
