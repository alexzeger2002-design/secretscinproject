import { Router } from 'express';
import { clickController } from '../controllers/clickController';

const router = Router();

// Публичный роут (вызывается фронтендом)
router.post('/', clickController.registerClickByCode.bind(clickController));

export default router;
