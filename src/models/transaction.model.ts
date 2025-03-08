import { Schema, model, Document } from 'mongoose';

interface ITransaction extends Document {
    ticketId: Schema.Types.ObjectId;
    amount: number;
    paymentMethod: string;
    status: 'Paid' | 'Failed' | 'Refunded';
    transactionDate: Date;
}

const transactionSchema = new Schema<ITransaction>({
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ['Paid', 'Failed', 'Refunded'], default: 'Paid' },
    transactionDate: { type: Date, default: Date.now },
});

export default model<ITransaction>('Transaction', transactionSchema);