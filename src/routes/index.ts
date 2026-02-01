import { Router } from 'express';
import visitRoutes from './visitRoutes';
import statsRoutes from './statsRoutes';
import adminRoutes from './adminRoutes';
import linkRoutes from './linkRoutes';
import clickRoutes from './clickRoutes';
import exportRoutes from './exportRoutes';

const router = Router();

// Публичные роуты
router.use('/visit', visitRoutes);
router.use('/stats', statsRoutes);
router.use('/click', clickRoutes);

// Админ-панель роуты
router.use('/admin', adminRoutes);
router.use('/links', linkRoutes);
router.use('/export', exportRoutes);

export default router;
