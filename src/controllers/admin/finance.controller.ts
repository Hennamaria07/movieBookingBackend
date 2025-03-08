import { Request, Response } from 'express';
import Transaction from '../../models/transaction.model';

export const getFinanceReport = async (req: Request, res: Response) => {
    try {
        const transactions = await Transaction.find();
        const totalRevenue = await Transaction.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        res.json({ transactions, totalRevenue: totalRevenue[0]?.total || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching finance report', error });
    }
};