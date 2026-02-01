import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: AppError = new Error('Authorization token required');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.substring(7); // Убираем "Bearer "
    const payload = verifyToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    console.error('[AUTH] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
    const appError: AppError = error instanceof Error ? error : new Error('Authentication failed');
    appError.statusCode = 401;
    next(appError);
  }
}
