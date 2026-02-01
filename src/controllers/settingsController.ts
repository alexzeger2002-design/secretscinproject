import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { settingsService } from '../services/settingsService';
import { AppError } from '../middlewares/errorHandler';

const updateTelegramUrlSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export class SettingsController {
  /**
   * Получает текущую ссылку на Telegram бота
   */
  async getTelegramBotUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const url = await settingsService.getTelegramBotUrl();
      res.json({
        success: true,
        url: url || process.env.TELEGRAM_LINK || null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Публичный роут для получения ссылки на Telegram бота (для кнопок на сайте)
   */
  async getTelegramBotUrlPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const url = await settingsService.getTelegramBotUrl();
      if (!url) {
        const error: AppError = new Error('Telegram bot URL is not configured');
        error.statusCode = 404;
        throw error;
      }
      res.json({
        success: true,
        url,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновляет ссылку на Telegram бота
   */
  async updateTelegramBotUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = updateTelegramUrlSchema.parse(req.body);
      const authReq = req as any;
      const userId = authReq.user?.userId;

      await settingsService.setTelegramBotUrl(validatedData.url, userId);

      res.json({
        success: true,
        message: 'Telegram bot URL updated successfully',
        url: validatedData.url,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
