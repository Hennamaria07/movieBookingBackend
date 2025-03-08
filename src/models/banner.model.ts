import { Document, model, Schema } from "mongoose";

export interface IBanner extends Document {
    title: string;
    uniqueId: string;
    bannerImage1: {
        converImage: {
            publicId: string;
            url: string;
        },
        cardImage: {
            publicId: string;
            url: string;
        },
    },
    bannerImage2: {
        converImage: {
            publicId: string;
            url: string;
        },
        cardImage: {
            publicId: string;
            url: string;
        },
    },
    bannerImage3: {
        converImage: {
            publicId: string;
            url: string;
        },
        cardImage: {
            publicId: string;
            url: string;
        },
    },

}

const bannerSchema = new Schema<IBanner>({
    title: { type: String, required: true },
    uniqueId: { type: String, required: true, unique: true },
    bannerImage1: {
        converImage: {
            publicId: { type: String, required: true },
            url: { type: String, required: true },
        },
        cardImage: {
            publicId: { type: String, required: true },
            url: { type: String, required: true },
        },
    },
    bannerImage2: {
        converImage: {
            publicId: { type: String,  },
            url: { type: String,  },
        },
        cardImage: {
            publicId: { type: String,  },
            url: { type: String,  },
        },
    },
    bannerImage3: {
        converImage: {
            publicId: { type: String,  },
            url: { type: String,  },
        },
        cardImage: {
            publicId: { type: String,  },
            url: { type: String,  },
        },
    },
});

export default model<IBanner>('Banner', bannerSchema);