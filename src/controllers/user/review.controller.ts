import { Request, Response } from 'express';
import Review from '../../models/review.model';

export const createReview = async (req: any, res: Response) => {
    try {
        const { movieId, rating, content } = req.body;
        const review = await Review.create({
            userId: req.user.id,
            movieId,
            rating,
            content,
        });
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Error creating review', error });
    }
};

export const getReviewsByMovie = async (req: any, res: Response) => {
    try {
        const reviews = await Review.find({ movieId: req.params.movieId });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error });
    }
};

export const updateReview = async (req: any, res: Response) => {
    try {
        const { rating, content } = req.body;
        const review = await Review.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { rating, content },
            { new: true }
        );
        if (!review) return res.status(404).json({ message: 'Review not found or unauthorized' });
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Error updating review', error });
    }
};

export const deleteReview = async (req: any, res: Response) => {
    try {
        const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!review) return res.status(404).json({ message: 'Review not found or unauthorized' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error });
    }
};