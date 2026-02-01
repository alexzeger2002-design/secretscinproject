import rateLimit from 'express-rate-limit';
import { getClientIp } from '../utils/ip';
import { Request } from 'express';

// Базовый rate limiter для API
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Используем IP + fingerprint для более точного ограничения
    const ip = getClientIp(req);
    const fingerprint = (req.body?.fingerprint || req.query?.fingerprint) as string;
    return fingerprint ? `${ip}:${fingerprint}` : ip;
  },
});

// Строгий rate limiter для создания визитов (защита от спама)
export const visitRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // максимум 10 визитов в минуту с одного IP/fingerprint
  message: {
    success: false,
    error: 'Too many visit requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = getClientIp(req);
    const fingerprint = (req.body?.fingerprint || req.query?.fingerprint) as string;
    return fingerprint ? `${ip}:${fingerprint}` : ip;
  },
  skip: (req: Request) => {
    // Применяем лимит только к POST запросам на /api/visit
    // Пропускаем (не применяем лимит) к остальным запросам
    return req.method !== 'POST' || !req.path.includes('/visit');
  },
});
