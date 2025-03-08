import { cloudinaryInstance } from "../config/cloudinary.config";


const deleteImage = async (publicId: string) => {
    try {
        if(!publicId) {
            throw new Error('Cannot get the public key');
        }
        const response = await cloudinaryInstance.uploader.destroy(publicId)
        return response
    } catch (error: any) {
       throw new Error(error.message)
    }
}

export default deleteImage