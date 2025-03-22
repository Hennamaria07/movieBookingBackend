import mongoose, { Schema } from 'mongoose';

const showtimeSchema = new mongoose.Schema({
  theaterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
  showName: { type: String, required: true },
  startTime: [String],
  duration: { type: String, required: true },
  Date: { type: Date, required: true },
  status: { type: String, enum: ['avaliable', 'high demand', 'sold out', 'cancelled'], default: 'avaliable' },
  totalSeats: { type: Number, required: true },
  avaliableSeats: { type: Number, required: true },
  bookedSeat: [{
    row: Number,
    seat: Number,
    categoryId: String,
  }],
  tempBookedSeats: {
    type: [{
      row: Number,
      seat: Number,
      categoryId: String,
      orderId: String,
    }],
    default: [],
  },
  image: {
    publicId: String,
    url: String,
  },
  poster: {
    publicId: String,
    url: String
  },
  genre: [String],
  review: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}],
});

export default mongoose.model('Showtime', showtimeSchema);