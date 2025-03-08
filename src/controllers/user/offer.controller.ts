import { Request, Response } from 'express';
import Offer from '../../models/offer.model';

export const getAllOffers = async (req: Request, res: Response) => {
    try {
        const offers = await Offer.find({ validUntil: { $gte: new Date() } });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers', error });
    }
};

export const getOfferById = async (req: Request, res: Response) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });
        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offer', error });
    }
};

export const applyOffer = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const offer = await Offer.findOne({ code });
        if (!offer || offer.validUntil < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired offer' });
        }
        res.json({ offer, message: 'Offer applied successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error applying offer', error });
    }
};