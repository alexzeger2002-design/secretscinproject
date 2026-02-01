import dotenv from 'dotenv';
import { createApp } from './app';
import prisma from './config/database';

// Загружаем переменные окружения
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = createApp();

// Инициализация настроек из переменных окружения при старте
const initializeSettings = async () => {
  try {
    const { settingsService } = await import('./services/settingsService');
    await settingsService.initializeFromEnv();
    console.log('✅ Settings initialized from environment variables');
  } catch (error) {
    console.error('⚠️ Failed to initialize settings:', error);
  }
};

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  await initializeSettings();
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} signal received: closing HTTP server and database connections...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await prisma.$disconnect();
      console.log('Database connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during database disconnection:', error);
      process.exit(1);
    }
  });

  // Принудительное завершение через 10 секунд
  setTimeout(() => {
    console.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
