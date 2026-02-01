import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Custom application errors
  if ('statusCode' in err && err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message || 'An error occurred',
    });
    return;
  }

  // Unknown errors - 500
  console.error('Unhandled error:', err);
  
  // Для ошибок логина показываем более понятное сообщение
  if (err.message === 'Invalid credentials' || err.message?.includes('Invalid')) {
    res.status(401).json({
      success: false,
      error: 'Неверный логин или пароль',
    });
    return;
  }
  
  // Для ошибок БД показываем понятное сообщение
  if (err.message?.includes('Can\'t reach') || err.message?.includes('P1001') || err.message?.includes('P2024')) {
    res.status(500).json({
      success: false,
      error: 'Ошибка подключения к базе данных. Попробуйте позже.',
    });
    return;
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
