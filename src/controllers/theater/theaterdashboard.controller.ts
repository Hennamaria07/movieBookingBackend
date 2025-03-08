import { Request, Response } from 'express';
import Booking from '../../models/booking.model';
import Theater from '../../models/theater.model';

export const getDashboardData = async (req: any, res: Response) => {
    try {
        const theaterId = req.user.assignedTheaters[0];
        const theater = await Theater.findById(theaterId);
        const totalBookings = await Booking.countDocuments({ theaterId });
        const revenue = await Booking.aggregate([
            { $match: { theaterId, status: 'Booked' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        res.json({
            totalScreens: theater?.screens.length,
            totalBookings,
            revenue: revenue[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data', error });
    }
};