import { Router } from 'express';
import { visitController } from '../controllers/visitController';

const router = Router();

router.post('/', visitController.createVisit.bind(visitController));

export default router;
