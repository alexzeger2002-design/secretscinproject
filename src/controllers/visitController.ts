import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { visitService } from '../services/visitService';
import { AppError } from '../middlewares/errorHandler';

// Zod schema для валидации запроса
const createVisitSchema = z.object({
  fingerprint: z.string().min(1, 'Fingerprint is required'),
  referrer: z.string().optional(),
  utm: z.record(z.string()).optional(),
  ua: z.string().min(1, 'User agent is required'),
  linkCode: z.string().optional(), // Код ссылки из URL
});

export class VisitController {
  async createVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Валидация данных
      const bodyData = createVisitSchema.parse(req.body);
      
      // Код ссылки может быть в query параметрах (из URL) или в body
      const linkCode = req.query.code as string || bodyData.linkCode;

      const validatedData = {
        ...bodyData,
        linkCode,
      };

      // Получаем ссылку напрямую из БД
      const { settingsService } = await import('../services/settingsService');
      const telegramLink = await settingsService.getTelegramBotUrl();
      
      if (!telegramLink) {
        const error: AppError = new Error('Telegram bot URL is not configured in database');
        error.statusCode = 500;
        throw error;
      }

      // Создаем визит для статистики (с коротким таймаутом, не блокируем ответ)
      let visitId = -1;
      const visitPromise = (async () => {
        try {
          const result = await Promise.race([
            visitService.createVisit(req, validatedData),
            new Promise<{ id: number; isSuspicious: boolean; linkId: number | null }>((_, reject) => 
              setTimeout(() => reject(new Error('Visit creation timeout')), 2000) // Таймаут 2 сек
            )
          ]);
          visitId = result.id;
          return result;
        } catch (error) {
          // Если не удалось - это нормально, клики отслеживаются через linkCode
          console.error('[VISIT] Failed to create visit in background:', error);
          return null;
        }
      })();

      // Сразу отправляем ответ с ссылкой (не ждем создания визита)
      res.status(201).json({
        success: true,
        redirectUrl: telegramLink,
        visitId: -1, // Временно -1, будет обновлен если визит успеет создаться
      });

      // Ждем максимум 2 секунды для создания визита, затем продолжаем
      visitPromise.catch(() => {
        // Игнорируем - ответ уже отправлен
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получает список визитов с пагинацией (для админки)
   */
  async getVisitsList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      // Валидация параметров пагинации
      if (isNaN(page) || page < 1) {
        throw new Error('Invalid page parameter');
      }
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new Error('Invalid limit parameter (must be between 1 and 100)');
      }

      // Формируем фильтры
      const filters: any = {};
      if (req.query.linkId) {
        const linkId = parseInt(req.query.linkId as string);
        if (!isNaN(linkId)) {
          filters.linkId = linkId;
        }
      }
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        if (!isNaN(startDate.getTime())) {
          filters.startDate = startDate;
        }
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        if (!isNaN(endDate.getTime())) {
          filters.endDate = endDate;
        }
      }
      if (req.query.country) {
        filters.country = req.query.country as string;
      }
      if (req.query.suspicious !== undefined) {
        filters.isSuspicious = req.query.suspicious === 'true';
      }

      const result = await visitService.getVisitsList(filters, { page, limit });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const visitController = new VisitController();
