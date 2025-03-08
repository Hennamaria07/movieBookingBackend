import { Schema, model, Document } from 'mongoose';

interface IReward extends Document {
    userId: Schema.Types.ObjectId;
    points: number;
    tier: 'Silver' | 'Gold' | 'Platinum';
    earnedAt: Date;
}

const rewardSchema = new Schema<IReward>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, required: true },
    tier: { type: String, enum: ['Silver', 'Gold', 'Platinum'], default: 'Silver' },
    earnedAt: { type: Date, default: Date.now },
});

export default model<IReward>('Reward', rewardSchema);