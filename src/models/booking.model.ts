import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  theaterId: { type: mongoose.Schema.Types.ObjectId, ref: "Theater", required: true },
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
  seats: [
    {
      seatNumber: { type: String, required: true },
      price: { type: Number, required: true },
      totalSeats: { type: Number, required: true },
      seatType: { type: String, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: "razorpay" },
  paymentIntentId: { type: String },
  paymentId: { type: String },
  razorpaySignature: { type: String },
  transactionStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending",
  },
  bookingDate: { type: Date }, // New field
  createdAt: { type: Date, default: Date.now }, // Optional: MongoDB timestamp
});

export default mongoose.model("Booking", bookingSchema);