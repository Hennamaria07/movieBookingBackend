import { Schema, model, Document } from 'mongoose';

interface ITheater extends Document {
    name: string;
    location: string;
    totalSeats: number;
    availableSeats: number;
    status: 'Active' | 'Inactive';
    theaterManagerId: Schema.Types.ObjectId;
    screens: Schema.Types.ObjectId[];
    shows: Schema.Types.ObjectId[];
}

const theaterSchema = new Schema<ITheater>({
    name: { type: String, required: true },
    location: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Inactive' },
    theaterManagerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    screens: [{ type: Schema.Types.ObjectId, ref: 'Screen' }],
    shows: [{ type: Schema.Types.ObjectId, ref: 'Showtime' }],
});

export default model<ITheater>('Theater', theaterSchema);