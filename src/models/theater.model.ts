import { Schema, model, Document } from 'mongoose';

interface IAmenities {
    cafe: boolean;
    wifi: boolean;
    accessibility: boolean;
    premium: boolean;
    snackBar: boolean;
    recliners: boolean;
    dolbyAtmos: boolean;
    imax: boolean;
    threeD: boolean;
    fourDX: boolean;
    laserProjection: boolean;
}

interface ITheater extends Document {
    owner: Schema.Types.ObjectId;
    name: string;
    location: string;
    description: string;
    totalSeats: number;
    availableSeats: number;
    status: 'Active' | 'Inactive' | 'Banned';
    screens: Schema.Types.ObjectId[];
    shows: Schema.Types.ObjectId[];
    image: {
        publicId: string;
        url: string;
    }
    amenities: IAmenities;
    phone: number;
    // rating: number;
}

const theaterSchema = new Schema<ITheater>({
    owner: { type: Schema.Types.ObjectId, ref: 'User'},
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    totalSeats: { type: Number},
    availableSeats: { type: Number},
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    screens: [{ type: Schema.Types.ObjectId, ref: 'Screen' }],
    shows: [{ type: Schema.Types.ObjectId, ref: 'Showtime' }],
    image: {
        publicId: { type: String},
        url: { type: String},
    },
    amenities: {
        cafe: {type: Boolean, default: false},
        wifi: {type: Boolean, default: false},
        accessibility: {type: Boolean, default: false},
        premium: {type: Boolean, default: false},
        snackBar: {type: Boolean, default: false},
        recliners: {type: Boolean, default: false},
        dolbyAtmos: {type: Boolean, default: false},
        imax: {type: Boolean, default: false},
        threeD: {type: Boolean, default: false},
        fourDX: {type: Boolean, default: false},
        laserProjection: {type: Boolean, default: false},
    },
    phone: {type: Number},
    // rating: { type: Number, min: 1, max: 5 },
});

export default model<ITheater>('Theater', theaterSchema);