import { Request, Response, NextFunction } from 'express';

// Extend Request type from auth.ts
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        assignedTheaters?: string[];
    };
}

export const roleMiddleware = (allowedRoles: string[]) => {
    return (req: any, res: any, next: NextFunction): any => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }
        next();
    };
};