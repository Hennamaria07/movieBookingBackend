import { Router } from 'express';
import * as homeController from '../controllers/user/home.controller';
import * as movieController from '../controllers/user/movie.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Public route (no auth required)
router.get('/movies', movieController.getAllMovies);

// Protected routes (require authentication)
router.get('/home', authMiddleware, homeController.getHomeData);
router.get('/all/theater-owners', homeController.getAllTheatorOwners);
router.get('/all', authMiddleware, homeController.getAllUsers);
router.get('/all/customers', homeController.getAllCustomers);
router.get('/all/admins', homeController.getAllAdmins);

// Protected route (requires User role)
router.get('/featured', authMiddleware, roleMiddleware(['User']), homeController.getFeaturedContent);

export default router;