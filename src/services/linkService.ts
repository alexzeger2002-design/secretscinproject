import prisma from '../config/database';
import crypto from 'crypto';

export interface CreateLinkData {
  name?: string;
  code?: string; // Если не указан, сгенерируется автоматически
}

export interface UpdateLinkData {
  name?: string;
  isActive?: boolean;
}

export class LinkService {
  /**
   * Генерирует уникальный код ссылки
   */
  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      // Генерируем случайный код из 8 символов (буквы и цифры)
      code = crypto.randomBytes(4).toString('hex');
      const link = await prisma.link.findUnique({ where: { code } });
      exists = !!link;
    }

    return code!;
  }

  /**
   * Создает новую ссылку
   */
  async createLink(data: CreateLinkData) {
    const code = data.code || await this.generateUniqueCode();

    // Проверяем, не существует ли код
    if (data.code) {
      const existing = await prisma.link.findUnique({ where: { code } });
      if (existing) {
        throw new Error('Link with this code already exists');
      }
    }

    return prisma.link.create({
      data: {
        code,
        name: data.name || null,
      },
    });
  }

  /**
   * Получает все ссылки
   */
  async getAllLinks(includeStats = false) {
    const links = await prisma.link.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (includeStats) {
      return Promise.all(
        links.map(async (link) => {
          const [visitsCount, clicksCount] = await Promise.all([
            prisma.visit.count({ where: { linkId: link.id } }),
            // @ts-ignore - Prisma client will be generated after migration
            (prisma as any).click.count({ where: { linkId: link.id } }),
          ]);

          return {
            ...link,
            stats: {
              visits: visitsCount,
              clicks: clicksCount,
              conversionRate: visitsCount > 0 ? (clicksCount / visitsCount) * 100 : 0,
            },
          };
        })
      );
    }

    return links;
  }

  /**
   * Получает ссылку по коду
   */
  async getLinkByCode(code: string) {
    return prisma.link.findUnique({
      where: { code },
    });
  }

  /**
   * Получает ссылку по ID
   */
  async getLinkById(id: number) {
    return prisma.link.findUnique({
      where: { id },
    });
  }

  /**
   * Обновляет ссылку
   */
  async updateLink(id: number, data: UpdateLinkData) {
    return prisma.link.update({
      where: { id },
      data,
    });
  }

  /**
   * Удаляет ссылку
   */
  async deleteLink(id: number) {
    return prisma.link.delete({
      where: { id },
    });
  }
}

export const linkService = new LinkService();
