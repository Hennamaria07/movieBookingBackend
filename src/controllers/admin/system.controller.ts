import { Request, Response } from 'express';

export const getSystemHealth = async (req: Request, res: Response) => {
    try {
        // Placeholder for system health check (e.g., DB status, uptime)
        res.json({ status: 'healthy', uptime: process.uptime() });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching system health', error });
    }
};