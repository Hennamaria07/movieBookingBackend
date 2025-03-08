import { Request, Response } from 'express';
import Ticket from '../../models/ticket.model';
import Showtime from '../../models/showtime.model';

export const createTicket = async (req: any, res: Response) => {
    try {
        const { showtimeId, seatNumber } = req.body;
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
        const ticket = await Ticket.create({
            showtimeId,
            userId: req.user.id,
            seatNumber,
        });
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ticket', error });
    }
};

export const getUserTickets = async (req: any, res: Response) => {
    try {
        const tickets = await Ticket.find({ userId: req.user.id }).populate('showtimeId');
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets', error });
    }
};

export const cancelTicket = async (req: any, res: Response) => {
    try {
        const ticket = await Ticket.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { status: 'Cancelled' },
            { new: true }
        );
        if (!ticket) return res.status(404).json({ message: 'Ticket not found or unauthorized' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling ticket', error });
    }
};