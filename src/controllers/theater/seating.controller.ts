import { Request, Response } from 'express';
import Screen from '../../models/screen.model';

export const createScreen = async (req: any, res: Response) => {
    try {
        const screen = await Screen.create({ ...req.body, theaterId: req.user.assignedTheaters[0] });
        res.status(201).json(screen);
    } catch (error) {
        res.status(500).json({ message: 'Error creating screen', error });
    }
};

export const getScreens = async (req: any, res: Response) => {
    try {
        const screens = await Screen.find({ theaterId: req.user.assignedTheaters[0] });
        res.json(screens);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching screens', error });
    }
};

export const updateScreen = async (req: any, res: Response) => {
    try {
        const screen = await Screen.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!screen) return res.status(404).json({ message: 'Screen not found' });
        res.json(screen);
    } catch (error) {
        res.status(500).json({ message: 'Error updating screen', error });
    }
};

export const deleteScreen = async (req: any, res: Response) => {
    try {
        const screen = await Screen.findByIdAndDelete(req.params.id);
        if (!screen) return res.status(404).json({ message: 'Screen not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting screen', error });
    }
};