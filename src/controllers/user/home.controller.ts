import { Request } from 'express';
import Movie from '../../models/movie.model';
import Offer from '../../models/offer.model';
import User from '../../models/user.model';

export const getHomeData = async (req: Request, res: any) => {
    try {
        const activeMovies = await Movie.find({ status: 'Now Showing' }).limit(4);
        const upcomingMovies = await Movie.find({ status: 'Coming Soon' }).limit(4);
        const currentOffers = await Offer.find({ validUntil: { $gte: new Date() } }).limit(3);

        res.json({ activeMovies, upcomingMovies, currentOffers });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching home data', error });
    }
};

export const getFeaturedContent = async (req: Request, res: any) => {
    try {
        const trendingMovies = await Movie.find({ status: 'Trending' }).limit(5);
        res.json({ trendingMovies });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching featured content', error });
    }
};

export const getAllTheatorOwners = async (req: Request, res: any) => {
    try {
        const theaterOwners = await User.find({ role: 'theaterOwner' });
        res.json({
            success: true,
            data: theaterOwners
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req: Request, res: any) => {
    try {
        const users = await User.find();
        res.json({
            success: true,
            data: users
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllAdmins = async (req: Request, res: any) => {
    try {
        const admins = await User.find({ role: 'admin' });
        res.json({
            success: true,
            data: admins
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllCustomers = async (req: Request, res: any) => {
    try {
        const customers = await User.find({ role: 'user' });
        res.json({
            success: true,
            data: customers
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserById = async (req: Request, res: any) => {
    try {
        const user = await User.findById(req.params.id);
        res.json({
            success: true,
            data: user
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}