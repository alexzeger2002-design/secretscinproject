import prisma from '../config/database';
import { PaginatedResponse, PaginationParams } from './visitService';

export interface ClickFilters {
  linkId?: number;
  visitId?: number;
  startDate?: Date;
  endDate?: Date;
}

export class ClickService {
  /**
   * Регистрирует клик (переход в Telegram)
   * Предотвращает дублирование кликов для одного visitId
   */
  async registerClick(visitId: number, linkId: number) {
    // Проверяем, не зарегистрирован ли уже клик для этого визита
    const existingClick = await prisma.click.findUnique({
      where: { visitId },
    });

    if (existingClick) {
      // Возвращаем существующий клик, если он уже есть
      return existingClick;
    }

    // Создаем новый клик
    return prisma.click.create({
      data: {
        visitId,
        linkId,
      },
    });
  }

  /**
   * Получает количество кликов по ссылке
   */
  async getClicksCount(linkId: number, startDate?: Date, endDate?: Date) {
    return prisma.click.count({
      where: {
        linkId,
        ...(startDate || endDate ? {
          timestamp: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        } : {}),
      },
    });
  }

  /**
   * Получает список кликов с пагинацией и фильтрами
   */
  async getClicksList(filters?: ClickFilters, pagination?: PaginationParams): Promise<PaginatedResponse<any>> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 50, 100); // Максимум 100 записей на страницу
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Применяем фильтры
    if (filters?.linkId) {
      whereClause.linkId = filters.linkId;
    }

    if (filters?.visitId) {
      whereClause.visitId = filters.visitId;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.timestamp = {};
      if (filters.startDate) whereClause.timestamp.gte = filters.startDate;
      if (filters.endDate) whereClause.timestamp.lte = filters.endDate;
    }

    // Параллельно получаем данные и общее количество
    const [clicks, total] = await Promise.all([
      // @ts-ignore - Prisma client will be generated after migration
      (prisma as any).click.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          visit: {
            select: {
              id: true,
              ip: true,
              country: true,
              userAgent: true,
              isSuspicious: true,
            },
          },
          link: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      // @ts-ignore - Prisma client will be generated after migration
      (prisma as any).click.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: clicks,
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

export const clickService = new ClickService();
