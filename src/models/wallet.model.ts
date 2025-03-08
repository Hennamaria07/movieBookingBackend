import { Schema, model, Document } from 'mongoose';

interface IWallet extends Document {
    userId: Schema.Types.ObjectId;
    balance: number;
    transactions: Schema.Types.ObjectId[];
}

const walletSchema = new Schema<IWallet>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
});

export default model<IWallet>('Wallet', walletSchema);