import { Router } from 'express';
import * as bookingController from '../controllers/theater/booking.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Theater Manager-only routes
router.get('/bookings', authMiddleware, roleMiddleware(['TheaterManager']), bookingController.getBookings);
router.put('/bookings/:id/refund', authMiddleware, roleMiddleware(['TheaterManager']), bookingController.approveRefund);

export default router;