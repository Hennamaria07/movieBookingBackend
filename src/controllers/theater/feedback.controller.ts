import { Request, Response } from 'express';
import Review from '../../models/review.model';

export const getFeedback = async (req: Request, res: Response) => {
    try {
        const reviews = await Review.find().populate('movieId', 'title');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback', error });
    }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Error updating feedback status', error });
    }
};