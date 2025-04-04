import { Schema, model, Document } from 'mongoose';

interface IMovie extends Document {
    title: string;
    genre: string[];
    duration: number;
    language: string;
    releaseDate: Date;
    posterPath?: {
        publicId: string;
        url: string;
    };
    status: 'Now Showing' | 'Coming Soon' | 'Trending';
}

const movieSchema = new Schema<IMovie>({
    title: { type: String, required: true },
    genre: [{ type: String }],
    duration: { type: Number, required: true }, // in minutes
    language: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    posterPath: {
        publicId: { type: String },
        url: { type: String },
    },
    status: { type: String, enum: ['Now Showing', 'Coming Soon', 'Trending'], default: 'Coming Soon' },
});

export default model<IMovie>('Movie', movieSchema);