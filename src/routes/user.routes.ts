import { Router } from 'express';
import * as homeController from '../controllers/user/home.controller';
import * as movieController from '../controllers/user/movie.controller';
import * as BookingController from '../controllers/user/booking.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Public route (no auth required)
router.get('/movies', movieController.getAllMovies);

// Protected routes (require authentication)
router.get('/home', authMiddleware, homeController.getHomeData);
router.get('/all/theater-owners', homeController.getAllTheatorOwners);
router.get('/all', homeController.getAllUsers);
router.get('/all/customers', homeController.getAllCustomers);
router.get('/all/admins', homeController.getAllAdmins);
router.get('/:id', authMiddleware, homeController.getUserById);

// booking
router.post('/book/show', authMiddleware, BookingController.createBooking);
router.get('/bookings', authMiddleware, BookingController.getAllBookings);
router.get('/bookings/theater/:theaterId', authMiddleware, BookingController.getTheaterBookings);
router.get('/bookings', authMiddleware, BookingController.getAllBookings);
router.get('/bookings-by-user/:id', authMiddleware, BookingController.getAllBookedShowsByUser);
router.post('/bookings/refund/:bookingId', authMiddleware, BookingController.cancelBooking);
router.patch('/bookings/confirm/payment', authMiddleware, BookingController.confirmPayment);
router.put('/booking/:bookingId/modify', authMiddleware, BookingController.modifyBooking);
router.post('/booking/confirm/modified/payment/:bookingId', authMiddleware, BookingController.confirmModifyPayment);
router.post('/showtimes/:showtimeId/reviews', authMiddleware, BookingController.reviewController);
router.get('/showtimes/:showtimeId/reviews/user', authMiddleware, BookingController.getUserReview);



// Protected route (requires User role)
router.get('/featured', authMiddleware, roleMiddleware(['User']), homeController.getFeaturedContent);

export default router;