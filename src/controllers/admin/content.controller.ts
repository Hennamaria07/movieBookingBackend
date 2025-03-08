import { Request, Response } from 'express';
import Movie from '../../models/movie.model';

export const createMovie = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.create(req.body);
        res.status(201).json(movie);
    } catch (error) {
        res.status(500).json({ message: 'Error creating movie', error });
    }
};

export const updateMovie = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: 'Error updating movie', error });
    }
};

export const deleteMovie = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting movie', error });
    }
};