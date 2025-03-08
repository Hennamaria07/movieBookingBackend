import { Request, Response } from 'express';
import Showtime from '../../models/showtime.model';

export const createShowtime = async (req: Request, res: Response) => {
    try {
        const { movieId, screenId, startTime, endTime, price } = req.body;
        const showtime = await Showtime.create({ movieId, screenId, startTime, endTime, price });
        res.status(201).json(showtime);
    } catch (error) {
        res.status(500).json({ message: 'Error creating showtime', error });
    }
};

export const getShowtimes = async (req: Request, res: Response) => {
    try {
        const showtimes = await Showtime.find().populate('movieId screenId');
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching showtimes', error });
    }
};

export const updateShowtime = async (req: Request, res: Response) => {
    try {
        const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
        res.json(showtime);
    } catch (error) {
        res.status(500).json({ message: 'Error updating showtime', error });
    }
};

export const deleteShowtime = async (req: Request, res: Response) => {
    try {
        const showtime = await Showtime.findByIdAndDelete(req.params.id);
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting showtime', error });
    }
};