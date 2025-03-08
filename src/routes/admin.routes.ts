import { Router } from 'express';
import * as bannerController from '../controllers/admin/banner.controller';
import upload from '../middlewares/middleware.multer';

const router = Router();

router.post('/banners', upload.fields([{ name: 'converImage1', maxCount: 1}, { name: 'cardImage1', maxCount: 1 }, {name: 'converImage2', maxCount: 1}, {name: 'cardImage2', maxCount: 1}, {name: 'converImage3', maxCount: 1}, {name: 'cardImage3', maxCount: 1} ]), bannerController.createBanner);


export default router;