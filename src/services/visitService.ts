import prisma from '../config/database';
import geoip from 'geoip-lite';
import { getClientIp } from '../utils/ip';
import { Request } from 'express';
import { linkService } from './linkService';

export interface CreateVisitData {
  fingerprint: string;
  referrer?: string;
  utm?: Record<string, string>;
  ua: string;
  linkCode?: string; // Код ссылки из URL
}

export interface VisitFilters {
  linkId?: number;
  startDate?: Date;
  endDate?: Date;
  country?: string;
  isSuspicious?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class VisitService {
  /**
   * Определяет страну по IP адресу
   */
  private getCountryByIp(ip: string): string | null {
    // Пропускаем localhost и внутренние IP (IPv4 и IPv6)
    if (
      ip === 'unknown' || 
      ip === '::1' || 
      ip === '::ffff:127.0.0.1' ||
      ip.startsWith('127.') || 
      ip.startsWith('192.168.') || 
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||  // 172.16.0.0 - 172.31.255.255 (private range)
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.') ||
      ip.startsWith('169.254.') || // Link-local IPv4
      ip.startsWith('fe80:') ||    // IPv6 link-local
      ip.startsWith('fc00:') ||    // IPv6 unique local
      ip.startsWith('fd00:')       // IPv6 unique local
    ) {
      return null;
    }

    try {
      const geo = geoip.lookup(ip);
      return geo?.country || null;
    } catch (error) {
      console.error('[VISIT] Error looking up country for IP:', ip, error);
      return null;
    }
  }

  /**
   * Проверяет, является ли визит подозрительным (фрод)
   * Если за последние 60 секунд было > 10 визитов с таким fingerprint - это фрод
   */
  private async checkSuspicious(fingerprint: string): Promise<boolean> {
    try {
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      
      const recentVisitsCount = await Promise.race([
        prisma.visit.count({
          where: {
            browserFingerprint: fingerprint,
            timestamp: {
              gte: sixtySecondsAgo,
            },
          },
        }),
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 2000)) // Таймаут 2 секунды
      ]);

      return recentVisitsCount > 10;
    } catch (error) {
      // Если ошибка БД - считаем визит не подозрительным
      console.error('Error checking suspicious visit:', error);
      return false;
    }
  }

  /**
   * Создает новую запись о визите
   */
  async createVisit(req: Request, data: CreateVisitData): Promise<{ id: number; isSuspicious: boolean; linkId: number | null }> {
    const ip = getClientIp(req);
    const country = this.getCountryByIp(ip);
    
    // Проверяем подозрительность с обработкой ошибок
    let isSuspicious = false;
    try {
      isSuspicious = await this.checkSuspicious(data.fingerprint);
    } catch (error) {
      console.error('Error checking suspicious:', error);
    }

    // Находим ссылку по коду, если указан (с таймаутом)
    let linkId: number | null = null;
    if (data.linkCode) {
      try {
        const link = await Promise.race([
          linkService.getLinkByCode(data.linkCode),
          new Promise<any>((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
        if (link && link.isActive) {
          linkId = link.id;
        }
      } catch (error) {
        console.error('Error getting link by code:', error);
      }
    }

    // Пытаемся создать визит с таймаутом
    try {
      const visit = await Promise.race([
        prisma.visit.create({
          data: {
            linkId,
            ip,
            country,
            browserFingerprint: data.fingerprint,
            userAgent: data.ua,
            referrer: data.referrer || null,
            utmTags: data.utm || undefined,
            isSuspicious,
          },
        }),
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )
      ]);

      return {
        id: visit.id,
        isSuspicious: visit.isSuspicious,
        linkId: visit.linkId,
      };
    } catch (error) {
      // Если не удалось сохранить в БД - возвращаем фиктивный ID
      // Сайт все равно должен работать
      console.error('Error creating visit (continuing without DB):', error);
      return {
        id: -1, // Фиктивный ID
        isSuspicious: false,
        linkId: linkId,
      };
    }
  }

  /**
   * Получает список визитов с пагинацией и фильтрами
   */
  async getVisitsList(filters?: VisitFilters, pagination?: PaginationParams): Promise<PaginatedResponse<any>> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 50, 100); // Максимум 100 записей на страницу
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Применяем фильтры
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

    if (filters?.isSuspicious !== undefined) {
      whereClause.isSuspicious = filters.isSuspicious;
    }

    // Параллельно получаем данные и общее количество
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          link: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.visit.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: visits,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

export const visitService = new VisitService();
