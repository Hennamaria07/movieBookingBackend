import { Request, Response } from 'express';
import Theater from '../../models/theater.model';

export const updateTheaterSettings = async (req: any, res: Response) => {
    try {
        const theater = await Theater.findByIdAndUpdate(
            req.user.assignedTheaters[0],
            req.body,
            { new: true }
        );
        if (!theater) return res.status(404).json({ message: 'Theater not found' });
        res.json(theater);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
};