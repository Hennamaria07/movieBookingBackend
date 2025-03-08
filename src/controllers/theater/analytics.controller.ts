import { Request, Response } from 'express';
import Booking from '../../models/booking.model';

export const getAnalytics = async (req: any, res: Response) => {
    try {
        const theaterId = req.user.assignedTheaters[0];
        const bookingStats = await Booking.aggregate([
            { $match: { theaterId } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        res.json(bookingStats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error });
    }
};