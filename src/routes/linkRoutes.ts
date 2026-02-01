import { Router } from 'express';
import { linkController } from '../controllers/linkController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Все роуты требуют авторизации
router.use(authenticate);

router.post('/', linkController.createLink.bind(linkController));
router.get('/', linkController.getAllLinks.bind(linkController));
router.get('/:id', linkController.getLinkById.bind(linkController));
router.put('/:id', linkController.updateLink.bind(linkController));
router.delete('/:id', linkController.deleteLink.bind(linkController));

export default router;
