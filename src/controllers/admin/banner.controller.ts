import { Request, Response } from 'express';
import Banner, { IBanner } from '../../models/banner.model'; // Assuming this is the correct path
import uploadCloudinary from '../../utils/uploadOnCloudinary'; // Adjust the path as needed
import deleteImage from '../../utils/destoryCloudinaryImage';

export const createBanner = async (req: Request, res: any) => {
    try {
        const { title, uniqueId } = req.body;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        // Validate required inputs
        if (!title || !uniqueId) {
            return res.status(400).json({ message: 'Title and uniqueId are required' });
        }

        // Check if banner with same uniqueId exists
        const existingBanner = await Banner.findOne({ uniqueId });
        if (existingBanner) {
            return res.status(400).json({ message: 'Banner with this uniqueId already exists' });
        }

        // Validate at least one pair of images is provided
        if (!files['converImage1'] || !files['cardImage1']) {
            return res.status(400).json({
                message: 'At least converImage1 and cardImage1 are required'
            });
        }

        // Prepare banner data
        const bannerData: Partial<any> = {
            title,
            uniqueId
        };

        // Process each image pair
        for (let i = 1; i <= 3; i++) {
            const converImageKey = `converImage${i}`;
            const cardImageKey = `cardImage${i}`;

            // Only process if both images in pair exist
            if (files[converImageKey] && files[cardImageKey]) {
                try {
                    // Upload cover image
                    const converImagePublicId = `banners/${uniqueId}_cover_${i}`;
                    const converImageUpload = await uploadCloudinary(
                        files[converImageKey][0].path,
                        converImagePublicId
                    );

                    // Upload card image
                    const cardImagePublicId = `banners/${uniqueId}_card_${i}`;
                    const cardImageUpload = await uploadCloudinary(
                        files[cardImageKey][0].path,
                        cardImagePublicId
                    );

                    // Add to banner data
                    bannerData[`bannerImage${i}` as any] = {
                        converImage: {
                            publicId: converImageUpload.public_id,
                            url: converImageUpload.secure_url
                        },
                        cardImage: {
                            publicId: cardImageUpload.public_id,
                            url: cardImageUpload.secure_url
                        }
                    };
                } catch (uploadError: any) {
                    return res.status(400).json({
                        message: `Error uploading image pair ${i}: ${uploadError.message}`
                    });
                }
            }
        }

        // Create new banner
        const banner = await Banner.create(bannerData);

        res.status(201).json({
            message: 'Banner created successfully',
            banner,
        });
    } catch (error: any) {
        console.error('Error creating banner:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateBanner = async (req: Request, res: any) => {
    try {
        const { title, uniqueId } = req.body;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        // Validate required inputs
        if (!uniqueId) {
            return res.status(400).json({ message: 'uniqueId is required' });
        }

        // Find existing banner
        const existingBanner: any = await Banner.findOne({ uniqueId });
        if (!existingBanner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        // Update title if provided
        if (title) {
            existingBanner.title = title;
        }

        // Process image updates if any files are provided
        const hasImageUpdates = Object.keys(files).length > 0;
        if (hasImageUpdates) {
            // Process each image pair
            for (let i = 1; i <= 3; i++) {
                const converImageKey = `converImage${i}`;
                const cardImageKey = `cardImage${i}`;

                // Check if this pair should be updated
                if (files[converImageKey] || files[cardImageKey]) {
                    // Both images must be provided together for update
                    if (!files[converImageKey] || !files[cardImageKey]) {
                        return res.status(400).json({
                            message: `Both ${converImageKey} and ${cardImageKey} must be provided together`
                        });
                    }

                    try {
                        // Delete old images from Cloudinary if they exist
                        const existingImage = existingBanner[`bannerImage${i}` as keyof IBanner];
                        if (existingImage) {
                            await deleteImage(existingImage.converImage.publicId);
                            await deleteImage(existingImage.cardImage.publicId);
                        }

                        // Upload new cover image
                        const converImagePublicId = `banners/${uniqueId}_cover_${i}`;
                        const converImageUpload = await uploadCloudinary(
                            files[converImageKey][0].path,
                            converImagePublicId
                        );

                        // Upload new card image
                        const cardImagePublicId = `banners/${uniqueId}_card_${i}`;
                        const cardImageUpload = await uploadCloudinary(
                            files[cardImageKey][0].path,
                            cardImagePublicId
                        );

                        // Update banner image
                        existingBanner[`bannerImage${i}` as any] = {
                            converImage: {
                                publicId: converImageUpload.public_id,
                                url: converImageUpload.secure_url
                            },
                            cardImage: {
                                publicId: cardImageUpload.public_id,
                                url: cardImageUpload.secure_url
                            }
                        };
                    } catch (uploadError: any) {
                        return res.status(400).json({
                            message: `Error uploading image pair ${i}: ${uploadError.message}`
                        });
                    }
                }
            }
        }

        // Save updated banner
        const updatedBanner = await existingBanner.save();
        return res.status(200).json({
            message: 'Banner updated successfully',
            banner: updatedBanner
        });

    } catch (error: any) {
        console.error('Error updating banner:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting banner', error });
    }
}