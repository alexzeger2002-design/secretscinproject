import prisma from '../config/database';

export interface StatsResponse {
  totalVisits: number;
  uniqueVisitors: number;
  totalClicks: number;
  conversionRate: number;
  topCountries: Array<{ country: string | null; count: number; percentage: number }>;
  countriesByIP: Array<{ country: string | null; count: number; percentage: number }>; // График по IP
  visitsByDate: Array<{ date: string; count: number }>; // График визитов по дням
  clicksByDate: Array<{ date: string; count: number }>; // График кликов по дням
}

export interface StatsFilters {
  linkId?: number;
  startDate?: Date;
  endDate?: Date;
  country?: string;
}

// Кеш на бэкенде (5 минут для более актуальных данных)
interface CacheEntry {
  data: StatsResponse;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут
const cache = new Map<string, CacheEntry>();

function getCacheKey(filters?: StatsFilters): string {
  if (!filters) return 'all';
  return JSON.stringify({
    linkId: filters.linkId,
    startDate: filters.startDate?.toISOString(),
    endDate: filters.endDate?.toISOString(),
    country: filters.country,
  });
}

function getCachedData(cacheKey: string): StatsResponse | null {
  const entry = cache.get(cacheKey);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    cache.delete(cacheKey);
    return null;
  }
  
  return entry.data;
}

function setCachedData(cacheKey: string, data: StatsResponse): void {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

export class StatsService {
  /**
   * Получает общую статистику визитов
   */
  async getStats(filters?: StatsFilters): Promise<StatsResponse> {
    // Проверяем кеш
    const cacheKey = getCacheKey(filters);
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Базовый ответ на случай ошибки
    const defaultResponse: StatsResponse = {
      totalVisits: 0,
      uniqueVisitors: 0,
      totalClicks: 0,
      conversionRate: 0,
      topCountries: [],
      countriesByIP: [],
      visitsByDate: [],
      clicksByDate: [],
    };

    const whereClause: any = {};

    if (filters?.linkId) {
      whereClause.linkId = filters.linkId;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.timestamp = {};
      if (filters.startDate) whereClause.timestamp.gte = filters.startDate;
      if (filters.endDate) whereClause.timestamp.lte = filters.endDate;
    }

    if (filters?.country) {
      whereClause.country = filters.country;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/85d3f238-c3aa-4cf2-9251-09dd60155ef0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'statsService.ts:84',message:'Stats query - whereClause before clean stats filter',data:{whereClause:JSON.stringify(whereClause),filters:JSON.stringify(filters)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Исключаем подозрительные визиты и click-tracked из чистой статистики
    whereClause.isSuspicious = false;
    whereClause.browserFingerprint = { not: 'click-tracked' };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/85d3f238-c3aa-4cf2-9251-09dd60155ef0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'statsService.ts:92',message:'Stats query - whereClause after clean stats filter',data:{whereClause:JSON.stringify(whereClause)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Для правильного подсчета кликов с учетом фильтров визитов
    // Всегда фильтруем клики только от чистых (не подозрительных) визитов
    // Получаем visitIds для правильного подсчета кликов
    const filteredVisitIds = await prisma.visit.findMany({
      where: whereClause,
      select: { id: true },
    }).then(visits => visits.map(v => v.id));
    
    let clickWhereClause: Record<string, any> = {};
    if (filteredVisitIds.length > 0) {
      // Фильтруем клики только для чистых визитов
      clickWhereClause.visitId = { in: filteredVisitIds };
      if (filters?.linkId) {
        clickWhereClause.linkId = filters.linkId;
      }
    } else {
      // Нет визитов, соответствующих фильтрам = нет кликов
      clickWhereClause.visitId = { in: [] };
    }

    let totalVisits = 0;
    let uniqueVisitors = 0;
    let totalClicks = 0;
    let countryStats: any[] = [];
    let countriesByIP: any[] = [];
    let visitsByDate: Array<{ date: string; count: number }> = [];
    let clicksByDate: Array<{ date: string; count: number }> = [];

    try {
      // #region agent log
      const totalVisitsBeforeFilter = await prisma.visit.count({ where: {} }).catch(() => 0);
      const suspiciousVisitsCount = await prisma.visit.count({ where: { isSuspicious: true } }).catch(() => 0);
      const clickTrackedCount = await prisma.visit.count({ where: { browserFingerprint: 'click-tracked' } }).catch(() => 0);
      const nullLinkIdCount = await prisma.visit.count({ where: { linkId: null } }).catch(() => 0);
      fetch('http://127.0.0.1:7242/ingest/85d3f238-c3aa-4cf2-9251-09dd60155ef0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'statsService.ts:137',message:'Visit counts breakdown before filtering',data:{totalVisitsBeforeFilter,suspiciousVisitsCount,clickTrackedCount,nullLinkIdCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Используем Promise.allSettled вместо Promise.all, чтобы ошибки в одном запросе не блокировали остальные
      const results = await Promise.allSettled([
        // Общее количество визитов
        prisma.visit.count({ where: whereClause }),

        // Количество уникальных посетителей (по fingerprint)
        // Используем DISTINCT для правильного подсчета уникальных fingerprint
        prisma.visit.groupBy({
          by: ['browserFingerprint'],
          where: whereClause,
          _count: {
            browserFingerprint: true,
          },
        }).then((result) => {
          // Возвращаем количество уникальных fingerprint
          // Фильтруем только те, где fingerprint не пустой и не 'click-tracked'
          return result.filter(r => r.browserFingerprint && r.browserFingerprint !== 'click-tracked').length;
        }),

        // Общее количество кликов (с учетом фильтров через visitId)
        // @ts-ignore - Prisma client will be generated after migration
        (prisma as any).click.count({ where: clickWhereClause }),

        // Статистика по странам (топ-10)
        prisma.visit.groupBy({
          by: ['country'],
          where: whereClause,
          _count: {
            country: true,
          },
          orderBy: {
            _count: {
              country: 'desc',
            },
          },
          take: 10,
        }),

        // Все страны по IP (для графика)
        prisma.visit.groupBy({
          by: ['country'],
          where: whereClause,
          _count: {
            country: true,
          },
          orderBy: {
            _count: {
              country: 'desc',
            },
          },
        }),

        // График визитов по дням (последние 30 дней)
        this.getVisitsByDate(whereClause),

        // График кликов по дням (последние 30 дней)
        this.getClicksByDate(clickWhereClause),
      ]);

      // Обрабатываем результаты, используя дефолтные значения при ошибках
      totalVisits = results[0].status === 'fulfilled' ? results[0].value : 0;
      uniqueVisitors = results[1].status === 'fulfilled' ? results[1].value : 0;
      totalClicks = results[2].status === 'fulfilled' ? results[2].value : 0;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/85d3f238-c3aa-4cf2-9251-09dd60155ef0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'statsService.ts:200',message:'Stats calculation results',data:{totalVisits,uniqueVisitors,totalClicks,hasFilters:!!filters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      countryStats = results[3].status === 'fulfilled' ? results[3].value : [];
      countriesByIP = results[4].status === 'fulfilled' ? results[4].value : [];
      visitsByDate = results[5].status === 'fulfilled' ? results[5].value : [];
      clicksByDate = results[6].status === 'fulfilled' ? results[6].value : [];

      // Логируем ошибки, но не прерываем выполнение
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[STATS] Error in query ${index}:`, result.reason?.message || result.reason);
        }
      });
    } catch (error) {
      console.error('[STATS] Critical error fetching stats, returning default:', error);
      // Возвращаем дефолтный ответ при критической ошибке
      return defaultResponse;
    }

    const totalForPercentage = totalVisits || 1;

    const topCountries = countryStats.map((stat: { country: string | null; _count: { country: number } }) => ({
      country: stat.country || 'Unknown',
      count: stat._count.country,
      percentage: (stat._count.country / totalForPercentage) * 100,
    }));

    const countriesByIPData = countriesByIP.map((stat: { country: string | null; _count: { country: number } }) => ({
      country: stat.country || 'Unknown',
      count: stat._count.country,
      percentage: (stat._count.country / totalForPercentage) * 100,
    }));

    const conversionRate = totalVisits > 0 ? (totalClicks / totalVisits) * 100 : 0;

    const result = {
      totalVisits,
      uniqueVisitors,
      totalClicks,
      conversionRate: Number(conversionRate.toFixed(2)),
      topCountries,
      countriesByIP: countriesByIPData,
      visitsByDate,
      clicksByDate,
    };

    // Сохраняем в кеш
    setCachedData(cacheKey, result);

    return result;
  }

  /**
   * Получает статистику по конкретной ссылке
   */
  async getLinkStats(linkId: number, filters?: Omit<StatsFilters, 'linkId'>): Promise<StatsResponse> {
    return this.getStats({ ...filters, linkId });
  }

  /**
   * График визитов по дням
   */
  private async getVisitsByDate(whereClause: any): Promise<Array<{ date: string; count: number }>> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Правильно объединяем условия timestamp
      const timestampFilter: any = {
        gte: thirtyDaysAgo,
      };

      // Если уже есть фильтр по датам, объединяем их правильно
      if (whereClause.timestamp) {
        if (whereClause.timestamp.gte) {
          // Берем более раннюю дату из фильтра или 30 дней назад
          timestampFilter.gte = new Date(Math.max(
            new Date(whereClause.timestamp.gte).getTime(),
            thirtyDaysAgo.getTime()
          ));
        }
        if (whereClause.timestamp.lte) {
          timestampFilter.lte = whereClause.timestamp.lte;
        }
      }

      const visits = await prisma.visit.findMany({
        where: {
          ...whereClause,
          timestamp: timestampFilter,
        },
        select: {
          timestamp: true,
        },
      }).catch(() => []);

    // Группируем по дням
    const visitsByDateMap = new Map<string, number>();
    
    visits.forEach((visit) => {
      const date = visit.timestamp.toISOString().split('T')[0];
      visitsByDateMap.set(date, (visitsByDateMap.get(date) || 0) + 1);
    });

      // Создаем массив для последних 30 дней
      const result: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          count: visitsByDateMap.get(dateStr) || 0,
        });
      }

      return result;
    } catch (error) {
      console.error('[STATS] Error in getVisitsByDate:', error);
      // Возвращаем пустой график за последние 30 дней
      const result: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        result.push({
          date: date.toISOString().split('T')[0],
          count: 0,
        });
      }
      return result;
    }
  }

  /**
   * График кликов по дням
   */
  private async getClicksByDate(clickWhereClause: Record<string, any>): Promise<Array<{ date: string; count: number }>> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Правильно объединяем условия timestamp
      const timestampFilter: any = {
        gte: thirtyDaysAgo,
      };

      // Если уже есть фильтр по датам, объединяем их правильно
      if (clickWhereClause.timestamp) {
        if (clickWhereClause.timestamp.gte) {
          // Берем более раннюю дату из фильтра или 30 дней назад
          timestampFilter.gte = new Date(Math.max(
            new Date(clickWhereClause.timestamp.gte).getTime(),
            thirtyDaysAgo.getTime()
          ));
        }
        if (clickWhereClause.timestamp.lte) {
          timestampFilter.lte = clickWhereClause.timestamp.lte;
        }
      }

      // Объединяем условия для where clause
      const whereClauseForClicks: any = {
        ...clickWhereClause,
        timestamp: timestampFilter,
      };

      // @ts-ignore - Prisma client will be generated after migration
      const clicks = await (prisma as any).click.findMany({
        where: whereClauseForClicks,
        select: {
          timestamp: true,
        },
      }).catch(() => []);

    // Группируем по дням
    const clicksByDateMap = new Map<string, number>();
    
    clicks.forEach((click: { timestamp: Date }) => {
      const date = click.timestamp.toISOString().split('T')[0];
      clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1);
    });

      // Создаем массив для последних 30 дней
      const result: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          count: clicksByDateMap.get(dateStr) || 0,
        });
      }

      return result;
    } catch (error) {
      console.error('[STATS] Error in getClicksByDate:', error);
      // Возвращаем пустой график за последние 30 дней
      const result: Array<{ date: string; count: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        result.push({
          date: date.toISOString().split('T')[0],
          count: 0,
        });
      }
      return result;
    }
  }
}

export const statsService = new StatsService();
