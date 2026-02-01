import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { apiRateLimiter, visitRateLimiter } from './middlewares/rateLimiter';
import { blockSuspiciousIPs } from './middlewares/ipBlocker';
import { errorHandler } from './middlewares/errorHandler';
import apiRoutes from './routes';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  // CORS: разрешаем все источники (можно ограничить конкретными доменами в production)
  app.use(cors({ 
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true 
  }));

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(morgan('dev'));

  // Trust proxy (для правильного определения IP за прокси)
  app.set('trust proxy', true);

  // Блокировка подозрительных IP (до rate limiting)
  app.use('/api', blockSuspiciousIPs);

  // Rate limiting
  app.use('/api', apiRateLimiter);
  
  // Строгий rate limiting для визитов
  app.use('/api/visit', visitRateLimiter);

  // API routes
  app.use('/api', apiRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
    });
  });

  // Error handler (должен быть последним)
  app.use(errorHandler);

  return app;
}
