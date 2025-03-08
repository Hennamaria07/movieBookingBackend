import { Schema, model, Document } from 'mongoose';

interface IOffer extends Document {
    title: string;
    description: string;
    code: string;
    discount: {
        type: 'percentage' | 'fixed';
        value: number;
    };
    validUntil: Date;
    minPurchase?: number;
    maxDiscount?: number;
    theaterId?: Schema.Types.ObjectId;
}

const offerSchema = new Schema<IOffer>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discount: {
        type: { type: String, enum: ['percentage', 'fixed'], required: true },
        value: { type: Number, required: true },
    },
    validUntil: { type: Date, required: true },
    minPurchase: Number,
    maxDiscount: Number,
    theaterId: { type: Schema.Types.ObjectId, ref: 'Theater' },
});

export default model<IOffer>('Offer', offerSchema);