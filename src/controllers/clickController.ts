import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { clickService } from '../services/clickService';
import { linkService } from '../services/linkService';
import prisma from '../config/database';

const registerClickSchema = z.object({
  visitId: z.number().int().optional(), // Может быть -1 или отсутствовать
  linkCode: z.string().optional(), // Альтернативный способ - по коду ссылки
});

export class ClickController {
  /**
   * Регистрирует клик (переход в Telegram)
   * Вызывается фронтендом после того, как пользователь нажал на кнопку в Telegram
   */
  async registerClick(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = registerClickSchema.parse(req.body);

      let linkId: number;

      // Если передан linkCode, находим ссылку по коду
      if (validatedData.linkCode) {
        const link = await linkService.getLinkByCode(validatedData.linkCode);
        if (!link) {
          throw new Error('Link not found');
        }
        linkId = link.id;
      } else {
        // Если передан только visitId, находим ссылку через визит
        const visit = await prisma.visit.findUnique({
          where: { id: validatedData.visitId },
          select: { linkId: true },
        });
        
        if (!visit || !visit.linkId) {
          throw new Error('Visit not found or not associated with a link');
        }
        linkId = visit.linkId;
      }

      // Регистрируем клик
      const click = await clickService.registerClick(validatedData.visitId, linkId);

      res.status(201).json({
        success: true,
        click: {
          id: click.id,
          timestamp: click.timestamp,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Упрощенный вариант - регистрация клика по visitId и linkCode
   * Поддерживает visitId = -1 или отсутствие visitId, если есть linkCode
   */
  async registerClickByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Валидация через Zod (visitId может быть -1 или отсутствовать)
      const clickByCodeSchema = z.object({
        visitId: z.number().int().optional(),
        linkCode: z.string().min(1).optional(),
      });
      
      const validatedData = clickByCodeSchema.parse({
        visitId: typeof req.body.visitId === 'string' ? parseInt(req.body.visitId) : req.body.visitId,
        linkCode: req.body.linkCode,
      });

      // Если visitId = -1 (фиктивный) или нет данных - просто возвращаем успех
      if ((validatedData.visitId === -1 || !validatedData.visitId) && !validatedData.linkCode) {
        res.status(201).json({
          success: true,
          click: {
            id: -1,
            timestamp: new Date(),
          },
        });
        return;
      }

      // Пытаемся найти ссылку и зарегистрировать клик
      let linkId: number | null = null;
      
      if (validatedData.linkCode) {
        try {
          const link = await Promise.race([
            linkService.getLinkByCode(validatedData.linkCode),
            new Promise<any>((resolve) => setTimeout(() => resolve(null), 2000))
          ]);
          if (link) {
            linkId = link.id;
          }
        } catch (error) {
          console.error('Error getting link:', error);
        }
      }

      // Если нашли linkId - пытаемся сохранить клик
      if (linkId) {
        try {
          let click;
          let actualVisitId = validatedData.visitId;
          
          // Если visitId валидный (> 0), используем его
          if (actualVisitId && actualVisitId > 0) {
            // Проверяем что визит существует
            const visitExists = await prisma.visit.findUnique({
              where: { id: actualVisitId },
              select: { id: true },
            });
            
            if (!visitExists) {
              // Визит не существует, создаем новый на лету
              const { visitService } = await import('../services/visitService');
              // Создаем минимальный визит (IP будет определен автоматически)
              const newVisit = await prisma.visit.create({
                data: {
                  linkId: linkId,
                  ip: req.ip || 'unknown',
                  browserFingerprint: 'click-tracked',
                  userAgent: req.headers['user-agent'] || 'Unknown',
                  isSuspicious: false,
                },
              });
              actualVisitId = newVisit.id;
            }
            
            click = await Promise.race([
              clickService.registerClick(actualVisitId, linkId),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              )
            ]);
          } else if (validatedData.linkCode) {
            // Если visitId = -1 или отсутствует, но есть linkCode
            // Создаем визит на лету для отслеживания клика
            console.log('Creating visit on-the-fly for click tracking with linkCode:', validatedData.linkCode);
            const newVisit = await prisma.visit.create({
              data: {
                linkId: linkId,
                ip: req.ip || 'unknown',
                browserFingerprint: 'click-tracked',
                userAgent: req.headers['user-agent'] || 'Unknown',
                isSuspicious: false,
              },
            });
            actualVisitId = newVisit.id;
            
            click = await Promise.race([
              clickService.registerClick(actualVisitId, linkId),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
              )
            ]);
          } else {
            // Нет ни visitId, ни linkCode - не можем создать клик
            console.log('Cannot track click: no visitId and no linkCode');
            res.status(201).json({
              success: true,
              click: {
                id: -1,
                timestamp: new Date(),
                message: 'Click tracked but not saved (no visitId or linkCode)',
              },
            });
            return;
          }
          
          res.status(201).json({
            success: true,
            click: {
              id: click.id,
              timestamp: click.timestamp,
            },
          });
          return;
        } catch (error) {
          console.error('Error registering click (continuing anyway):', error);
        }
      }

      // В любом случае возвращаем успех
      res.status(201).json({
        success: true,
        click: {
          id: -1,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Даже при ошибках возвращаем успех - клики не должны блокировать сайт
      console.error('Error in registerClickByCode (continuing anyway):', error);
      res.status(201).json({
        success: true,
        click: {
          id: -1,
          timestamp: new Date(),
        },
      });
    }
  }

  /**
   * Получает список кликов с пагинацией (для админки)
   */
  async getClicksList(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      if (req.query.visitId) {
        const visitId = parseInt(req.query.visitId as string);
        if (!isNaN(visitId)) {
          filters.visitId = visitId;
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

      const result = await clickService.getClicksList(filters, { page, limit });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clickController = new ClickController();
