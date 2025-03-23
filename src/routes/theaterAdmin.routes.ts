import { Router } from 'express';
import * as bookingController from '../controllers/theater/booking.controller';
import * as settingController from '../controllers/theater/settings.controller';
import * as showController from '../controllers/theater/show.controller';
import * as theaterController from '../controllers/theater/theaterdashboard.controller';
import * as theaterAnalyticsController from '../controllers/theater/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import upload from '../middlewares/middleware.multer';

const router = Router();

// Theater Manager-only routes
router.get('/bookings', authMiddleware, roleMiddleware(['TheaterManager']), bookingController.getBookings);
router.put('/bookings/:id/refund', authMiddleware, roleMiddleware(['TheaterManager']), bookingController.approveRefund);
router.post('/create', authMiddleware, roleMiddleware(['theaterOwner']), upload.single('image'), settingController.createTheater);
router.patch('/update/:id', authMiddleware, roleMiddleware(['theaterOwner']), upload.single('image'), settingController.updateTheater);
router.get('/all', settingController.getAllTheaters);
router.get('/:id', authMiddleware, roleMiddleware(['theaterOwner']), settingController.getTheaterById);
router.post('/screen', authMiddleware, roleMiddleware(['theaterOwner']), settingController.createScreen);
router.get('/screens/:theaterId', authMiddleware, roleMiddleware(['theaterOwner']), settingController.getScreensByTheater);
router.patch('/screen/update/:id', authMiddleware, roleMiddleware(['theaterOwner']), settingController.screenController);
router.delete('/screen/delete/:id', authMiddleware, roleMiddleware(['theaterOwner']), settingController.deleteScreen);
router.post('/show/create', authMiddleware, roleMiddleware(['theaterOwner']), upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
]), showController.createShowtime);
router.put('/show/update/:id', authMiddleware, roleMiddleware(['theaterOwner']), upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
]), showController.updateShowtime);
router.get('/all/shows', authMiddleware, roleMiddleware(['theaterOwner']), showController.getAllShowtimes)
router.get('/show/details/:id', authMiddleware, showController.getShowtime)
router.delete('/show/delete/:id', authMiddleware, roleMiddleware(['theaterOwner']), showController.deleteShowtime);
router.get('/hall/screens', authMiddleware, roleMiddleware(['theaterOwner']), showController.getTheaterHallByTheaterOwner);
router.get('/ongoing/shows', showController.getOnGoingShows);
router.get('/upcoming/shows', showController.getUpcomingShows);
router.get('/trending/shows', showController.trendingShows);

router.get('/:theaterId/overview', theaterController.getDashboardOverview);
router.get('/:theaterId/revenue', theaterController.getRevenueTrend);
router.get('/:theaterId/peak-hours', theaterController.getPeakHours);
router.get('/:theaterId/categories', theaterController.getCategoryDistribution);
router.get('/:theaterId/recent-bookings', theaterController.getRecentBookings);
router.get('/:theaterId/upcoming-shows', theaterController.getUpcomingShows);
router.get('/:theaterId/sales', authMiddleware, theaterAnalyticsController.getSalesReport);
router.get('/:theaterId/demographics', authMiddleware, theaterAnalyticsController.getDemographicsReport);
router.get('/:theaterId/peak-hours', authMiddleware, theaterAnalyticsController.getPeakHoursReport);

export default router;