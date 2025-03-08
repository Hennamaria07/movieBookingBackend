import { Schema, model, Document } from 'mongoose';

interface IBooking extends Document {
    userId: Schema.Types.ObjectId;
    theaterId: Schema.Types.ObjectId;
    showtimeId: Schema.Types.ObjectId;
    seats: string[];
    bookedAt: Date;
    status: 'Booked' | 'Cancelled' | 'Refunded';
}

const bookingSchema = new Schema<IBooking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    theaterId: { type: Schema.Types.ObjectId, ref: 'Theater', required: true },
    showtimeId: { type: Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: [{ type: String, required: true }],
    bookedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Booked', 'Cancelled', 'Refunded'], default: 'Booked' },
});

export default model<IBooking>('Booking', bookingSchema);