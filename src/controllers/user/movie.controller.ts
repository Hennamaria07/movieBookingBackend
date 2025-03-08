import { Request, Response } from 'express';
import Movie from '../../models/movie.model';

export const getAllMovies = async (req: Request, res: any) => {
    try {
        const movies = await Movie.find();
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching movies', error });
    }
};

export const getMovieById = async (req: any, res: any) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching movie', error });
    }
};

export const searchMovies = async (req: any, res: any) => {
    try {
        const { query } = req.query;
        const movies = await Movie.find({ title: { $regex: query as string, $options: 'i' } });
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: 'Error searching movies', error });
    }
};