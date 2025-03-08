import { Request, Response } from 'express';
import Booking from '../../models/booking.model';

export const getBookings = async (req: any, res: Response) => {
    try {
        const bookings = await Booking.find({ theaterId: req.user.assignedTheaters[0] });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error });
    }
};

export const approveRefund = async (req: any, res: any) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: 'Refunded' },
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error approving refund', error });
    }
};