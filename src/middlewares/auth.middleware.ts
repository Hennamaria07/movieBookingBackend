import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: any, res: Response, next: NextFunction): any | void => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    console.log(token, '<===token');
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message:"Unauthenicated request",
            isAuthenticated: false
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
           id: string; role: string; email: string; userId: string
        };
        console.log(decoded, '<===new decoded');
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email,
            userId: decoded.userId
        };
        next();
    } catch (error: any) {
        res.status(401).json({
            success: false,
            message: error.message,
            isAuthenticated: false,
        });
    }
};