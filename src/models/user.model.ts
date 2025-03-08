import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// First, let's fix the ISocialLogin interface to allow indexing with string keys
interface ISocialLogin {
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  [key: string]: string | undefined; // This allows for dynamic property access
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  avatar: {
    publicId: string;
    url: string;
  };
  password: string;
  userId: string;
  phone?: string;
  bannedReason?: string;
  role: "admin" | "theaterOwner" | "user";
  status: 'Active' | 'Banned';
  points: number;
  bookings: mongoose.Schema.Types.ObjectId[];
  reviews: mongoose.Schema.Types.ObjectId[];
  socialLogin?: ISocialLogin;
  isVerified: boolean;
  mfaEnabled: boolean;
  walletBalance: number;
  loyaltyPoints: number;
  resetToken?: string;
  resetTokenExpiry?: Date | number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>; // Fixed Promise return type
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: {
      publicId: { type: String, required: true },
      url: { type: String, required: true },
    },
    phone: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["admin", "theaterOwner", "user"],
      default: "user",
    },
    socialLogin: {
      googleId: { type: String, unique: true, sparse: true },
      facebookId: { type: String, unique: true, sparse: true },
      appleId: { type: String, unique: true, sparse: true },
    },
    status: { type: String, enum: ['Active', 'Banned', 'Inactive', 'Unbanned'] },
    bannedReason: { type: String },
    isVerified: { type: Boolean, default: true },
    mfaEnabled: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    loyaltyPoints: { type: Number, default: 0 },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// Compare password for login
UserSchema.methods.comparePassword = function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>("User", UserSchema);
export default User;