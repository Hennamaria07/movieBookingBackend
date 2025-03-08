import { Request, Response } from 'express';
import Theater from '../../models/theater.model';

export const createTheater = async (req: Request, res: Response) => {
    try {
        const theater = await Theater.create(req.body);
        res.status(201).json(theater);
    } catch (error) {
        res.status(500).json({ message: 'Error creating theater', error });
    }
};

export const getAllTheaters = async (req: Request, res: Response) => {
    try {
        const theaters = await Theater.find();
        res.json(theaters);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching theaters', error });
    }
};

export const updateTheater = async (req: Request, res: Response) => {
    try {
        const theater = await Theater.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!theater) return res.status(404).json({ message: 'Theater not found' });
        res.json(theater);
    } catch (error) {
        res.status(500).json({ message: 'Error updating theater', error });
    }
};

export const deleteTheater = async (req: Request, res: Response) => {
    try {
        const theater = await Theater.findByIdAndDelete(req.params.id);
        if (!theater) return res.status(404).json({ message: 'Theater not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting theater', error });
    }
};