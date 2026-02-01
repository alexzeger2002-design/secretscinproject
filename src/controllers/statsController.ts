import { Request, Response, NextFunction } from 'express';
import { statsService } from '../services/statsService';

// Импортируем функцию кеша (если она экспортирована)
// Если нет - используем другой подход

export class StatsController {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const linkId = req.query.linkId ? parseInt(req.query.linkId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const country = req.query.country as string | undefined;

      const filters = {
        ...(linkId && !isNaN(linkId) ? { linkId } : {}),
        ...(startDate && !isNaN(startDate.getTime()) ? { startDate } : {}),
        ...(endDate && !isNaN(endDate.getTime()) ? { endDate } : {}),
        ...(country ? { country } : {}),
      };

      const stats = await statsService.getStats(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(stats);
    } catch (error: any) {
      console.error('[STATS] Error in getStats:', error);
      res.json({
        totalVisits: 0,
        uniqueVisitors: 0,
        totalClicks: 0,
        conversionRate: 0,
        topCountries: [],
        countriesByIP: [],
        visitsByDate: [],
        clicksByDate: [],
      });
    }
  }

  async getLinkStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const linkId = parseInt(req.params.linkId);
      if (isNaN(linkId)) {
        throw new Error('Invalid link ID');
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const country = req.query.country as string | undefined;

      const filters = {
        ...(startDate && !isNaN(startDate.getTime()) ? { startDate } : {}),
        ...(endDate && !isNaN(endDate.getTime()) ? { endDate } : {}),
        ...(country ? { country } : {}),
      };

      const stats = await statsService.getLinkStats(linkId, Object.keys(filters).length > 0 ? filters : undefined);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const statsController = new StatsController();
