import { Router } from 'express';
import * as bannerController from '../controllers/admin/banner.controller';
import upload from '../middlewares/middleware.multer';
import { authMiddleware } from '../middlewares/auth.middleware';
import { exportReport, getRevenueAnalytics, getTheaterCommissions, getTransactions, updateTheaterCommission } from '../controllers/admin/finance.controller';

const router = Router();

router.post('/banners', upload.fields([{ name: 'converImage1', maxCount: 1}, { name: 'cardImage1', maxCount: 1 }, {name: 'converImage2', maxCount: 1}, {name: 'cardImage2', maxCount: 1}, {name: 'converImage3', maxCount: 1}, {name: 'cardImage3', maxCount: 1} ]), bannerController.createBanner);
router.get('/transactions', authMiddleware, getTransactions);
router.get('/commissions', authMiddleware, getTheaterCommissions);
router.put('/commissions', authMiddleware, updateTheaterCommission);
router.get('/analytics', authMiddleware, getRevenueAnalytics);
router.get('/export', authMiddleware, exportReport);

export default router;