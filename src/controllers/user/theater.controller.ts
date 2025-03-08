import { Request, Response } from 'express';
import Theater from '../../models/theater.model';

export const getAllTheaters = async (req: Request, res: Response) => {
    try {
        const theaters = await Theater.find({ status: 'Active' });
        res.json(theaters);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching theaters', error });
    }
};

export const getTheaterById = async (req: Request, res: Response) => {
    try {
        const theater = await Theater.findById(req.params.id).populate('shows');
        if (!theater) return res.status(404).json({ message: 'Theater not found' });
        res.json(theater);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching theater', error });
    }
};