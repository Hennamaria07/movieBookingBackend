import { Schema, model, Document } from 'mongoose';

interface IShowtime extends Document {
    movieId: Schema.Types.ObjectId;
    screenId: Schema.Types.ObjectId;
    startTime: Date;
    endTime: Date;
    price: number;
}

const showtimeSchema = new Schema<IShowtime>({
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    screenId: { type: Schema.Types.ObjectId, ref: 'Screen', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    price: { type: Number, required: true },
});

export default model<IShowtime>('Showtime', showtimeSchema);