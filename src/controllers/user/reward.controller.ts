import { Request, Response } from 'express';
import Reward from '../../models/review.model';

export const getUserRewards = async (req: any, res: Response) => {
    try {
        const rewards = await Reward.find({ userId: req.user.id });
        res.json(rewards);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rewards', error });
    }
};

export const redeemReward = async (req: any, res: Response) => {
    try {
        const reward = await Reward.findById(req.params.id);
        if (!reward || reward.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Reward not found or unauthorized' });
        }
        // Logic to redeem reward (e.g., deduct points, update status)
        res.json({ message: 'Reward redeemed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error redeeming reward', error });
    }
};