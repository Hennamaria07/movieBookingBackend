import { Schema, model, Document } from 'mongoose';

interface IReview extends Document {
    userId: Schema.Types.ObjectId;
    movieId: Schema.Types.ObjectId;
    rating: number;
    content: string;
    createdAt: Date;
    status: 'Pending' | 'Reviewed' | 'Action Taken';
}

const reviewSchema = new Schema<IReview>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: Schema.Types.ObjectId, ref: 'Showtime', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Action Taken'], default: 'Pending' },
});

export default model<IReview>('Review', reviewSchema);