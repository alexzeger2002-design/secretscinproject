import { Request } from 'express';

/**
 * Получает реальный IP адрес клиента, учитывая прокси (x-forwarded-for)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  
  if (typeof forwarded === 'string') {
    // x-forwarded-for может содержать несколько IP через запятую
    // Берем первый (оригинальный клиентский IP)
    return forwarded.split(',')[0].trim();
  }
  
  return req.ip || req.socket.remoteAddress || 'unknown';
}
