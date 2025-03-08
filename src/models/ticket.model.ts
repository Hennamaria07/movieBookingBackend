import { Schema, model, Document } from 'mongoose';

interface ITicket extends Document {
    showtimeId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    seatNumber: string;
    bookedAt: Date;
    status: 'Booked' | 'Cancelled';
}

const ticketSchema = new Schema<ITicket>({
    showtimeId: { type: Schema.Types.ObjectId, ref: 'Showtime', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seatNumber: { type: String, required: true },
    bookedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Booked', 'Cancelled'], default: 'Booked' },
});

export default model<ITicket>('Ticket', ticketSchema);