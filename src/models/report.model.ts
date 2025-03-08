import { Schema, model, Document } from 'mongoose';

interface IReport extends Document {
    reportedBy: string;
    contentType: 'Comment' | 'Image' | 'Review';
    reason: string;
    dateReported: Date;
    content: string;
    userId: Schema.Types.ObjectId;
}

const reportSchema = new Schema<IReport>({
    reportedBy: { type: String, required: true },
    contentType: { type: String, enum: ['Comment', 'Image', 'Review'], required: true },
    reason: { type: String, required: true },
    dateReported: { type: Date, default: Date.now },
    content: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export default model<IReport>('Report', reportSchema);