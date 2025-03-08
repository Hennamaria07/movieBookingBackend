import { Schema, model, Document } from 'mongoose';

interface IScreen extends Document {
    theaterId: Schema.Types.ObjectId;
    name: string;
    seatCapacity: number;
}

const screenSchema = new Schema<IScreen>({
    theaterId: { type: Schema.Types.ObjectId, ref: 'Theater', required: true },
    name: { type: String, required: true },
    seatCapacity: { type: Number, required: true },
});

export default model<IScreen>('Screen', screenSchema);