import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { getClientIp } from '../utils/ip';
import { AppError } from './errorHandler';

// Кэш заблокированных IP (в памяти, для быстрого доступа)
const blockedIPsCache = new Set<string>();
let cacheLastUpdate = 0;
const CACHE_TTL = 60000; // 1 минута

/**
 * Проверяет, заблокирован ли IP адрес
 */
async function isIPBlocked(ip: string): Promise<boolean> {
  // Проверяем кэш
  if (blockedIPsCache.has(ip)) {
    return true;
  }

  // Обновляем кэш, если он устарел
  const now = Date.now();
  if (now - cacheLastUpdate > CACHE_TTL) {
    try {
      blockedIPsCache.clear();
      
      // Получаем заблокированные IP из БД (можно добавить таблицу BlockedIP в будущем)
      // Пока используем подозрительные визиты как индикатор
      const suspiciousCount = await prisma.visit.count({
        where: {
          ip,
          isSuspicious: true,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // За последние 24 часа
          },
        },
      });

      // Если больше 50 подозрительных визитов за 24 часа - блокируем
      if (suspiciousCount > 50) {
        blockedIPsCache.add(ip);
        return true;
      }
      
      cacheLastUpdate = now;
    } catch (error) {
      // Если ошибка подключения к БД - пропускаем блокировку
      console.error('Error checking IP block:', error);
      return false;
    }
  }

  return false;
}

/**
 * Middleware для блокировки подозрительных IP
 */
export async function blockSuspiciousIPs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ip = getClientIp(req);

    // Пропускаем localhost и внутренние IP
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('::1')) {
      return next();
    }

    // Проверяем блокировку с таймаутом
    try {
      const isBlocked = await Promise.race([
        isIPBlocked(ip),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)) // Таймаут 1 секунда
      ]);
      
      if (isBlocked) {
        const error: AppError = new Error('Access denied');
        error.statusCode = 403;
        throw error;
      }
    } catch (dbError) {
      // Если ошибка БД - пропускаем запрос (не блокируем из-за проблем с БД)
      console.error('IP block check error (allowing request):', dbError);
    }

    next();
  } catch (error) {
    // Если это ошибка блокировки - передаем дальше
    if ((error as AppError).statusCode === 403) {
      next(error);
    } else {
      // Для других ошибок - пропускаем запрос
      next();
    }
  }
}
