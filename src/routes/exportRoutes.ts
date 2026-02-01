import { Router } from 'express';
import { exportController } from '../controllers/exportController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Все роуты требуют авторизации
router.use(authenticate);

router.get('/csv', exportController.exportCSV.bind(exportController));
router.get('/excel', exportController.exportExcel.bind(exportController));

export default router;
