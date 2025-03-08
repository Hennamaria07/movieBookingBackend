import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";

dotenv.config();
// console.log('name',process.env.CLOUDINARY_CLOUD_NAME)
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECERT
  })

  export const cloudinaryInstance = cloudinary;