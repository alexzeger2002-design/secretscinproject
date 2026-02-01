import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { visitController } from '../controllers/visitController';
import { clickController } from '../controllers/clickController';
import { settingsController } from '../controllers/settingsController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Публичные роуты
router.post('/login', adminController.login.bind(adminController));
router.post('/register', adminController.createAdmin.bind(adminController));
router.post('/update-password', adminController.updatePassword.bind(adminController));

// Защищенные роуты (требуют авторизации)
router.get('/me', authenticate, adminController.getMe.bind(adminController));

// Админские роуты для листинга визитов и кликов
router.get('/visits', authenticate, visitController.getVisitsList.bind(visitController));
router.get('/clicks', authenticate, clickController.getClicksList.bind(clickController));

// Настройки
router.get('/settings/telegram-bot-url', authenticate, settingsController.getTelegramBotUrl.bind(settingsController));
router.put('/settings/telegram-bot-url', authenticate, settingsController.updateTelegramBotUrl.bind(settingsController));

// Публичный роут для получения ссылки на бота (для кнопок на сайте)
router.get('/settings/telegram-bot-url/public', settingsController.getTelegramBotUrlPublic.bind(settingsController));

export default router;
