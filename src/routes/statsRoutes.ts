import { Router } from 'express';
import { statsController } from '../controllers/statsController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Публичный роут для общей статистики
router.get('/', statsController.getStats.bind(statsController));

// Защищенный роут для статистики по ссылке
router.get('/link/:linkId', authenticate, statsController.getLinkStats.bind(statsController));

export default router;
