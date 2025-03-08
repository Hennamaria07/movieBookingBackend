import { Request, Response } from 'express';
import Offer from '../../models/offer.model';

export const createOffer = async (req: any, res: Response) => {
    try {
        const offer = await Offer.create({ ...req.body, theaterId: req.user.assignedTheaters[0] });
        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ message: 'Error creating offer', error });
    }
};

export const getOffers = async (req: any, res: Response) => {
    try {
        const offers = await Offer.find({ theaterId: req.user.assignedTheaters[0] });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers', error });
    }
};

export const updateOffer = async (req: any, res: Response) => {
    try {
        const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!offer) return res.status(404).json({ message: 'Offer not found' });
        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: 'Error updating offer', error });
    }
};

export const deleteOffer = async (req: any, res: Response) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting offer', error });
    }
};