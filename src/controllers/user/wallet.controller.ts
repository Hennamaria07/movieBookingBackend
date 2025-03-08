import { Request, Response } from 'express';
import Wallet from '../../models/wallet.model';
import Transaction from '../../models/transaction.model';

export const getWallet = async (req: any, res: Response) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user.id }).populate('transactions');
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching wallet', error });
    }
};

export const addFunds = async (req: any, res: Response) => {
    try {
        const { amount } = req.body;
        const wallet = await Wallet.findOneAndUpdate(
            { userId: req.user.id },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );
        const transaction: any = await Transaction.create({
            ticketId: null,
            amount,
            paymentMethod: 'Card',
            status: 'Paid',
        });
        wallet.transactions.push(transaction._id);
        await wallet.save();
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: 'Error adding funds', error });
    }
};