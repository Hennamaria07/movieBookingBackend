import Showtime from '../../models/showtime.model';
import Screen from '../../models/screen.model';
import Theater from '../../models/theater.model';
import uploadCloudinary from '../../utils/uploadOnCloudinary';
import deleteImage from '../../utils/destoryCloudinaryImage';
import Booking from '../../models/booking.model';

export const createShowtime = async (req: any, res: any) => {
    try {
        const { 
            theaterId, 
            screenId, 
            startTime, 
            duration, 
            Date, 
            status, 
            showName,
            genre 
        } = req.body;
        console.log(req.body, '<===')
        const imageFile = req.files?.image?.[0];
        const posterFile = req.files?.poster?.[0];

        console.log('Request body:', req.body);

        if (!theaterId || !screenId || !startTime || !duration || !Date || !showName) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['theaterId', 'screenId', 'startTime', 'duration', 'Date', 'showName']
            });
        }

        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                message: 'Invalid screen id'
            });
        }
        const totalSeats = screen.totalSeats;

        let image = {};
        if (imageFile) {
            try {
                const uploadResult = await uploadCloudinary(imageFile.path, `showtimes/${showName}`);
                if (!uploadResult?.public_id || !uploadResult?.url) {
                    throw new Error("Upload failed");
                }
                image = {
                    publicId: uploadResult.public_id,
                    url: uploadResult.url
                };
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
            }
        }

        let poster = {};
        if (posterFile) {
            try {
                const uploadResult = await uploadCloudinary(posterFile.path, `showtimes/${showName}/posters`);
                if (!uploadResult?.public_id || !uploadResult?.url) {
                    throw new Error("Upload failed");
                }
                poster = {
                    publicId: uploadResult.public_id,
                    url: uploadResult.url
                };
            } catch (uploadError) {
                console.error("Poster upload failed:", uploadError);
            }
        }

        let genreArray = [];
        if (genre) {
            try {
                genreArray = typeof genre === 'string' ? JSON.parse(genre) : genre;
                if (!Array.isArray(genreArray)) {
                    genreArray = [];
                    console.log('Invalid genre format, defaulting to empty array');
                }
            } catch (parseError) {
                console.error('Error parsing genre:', parseError);
                genreArray = [];
            }
        }

        // Parse startTime to ensure it's an array of strings
        let startTimeArray: string[] = [];
        try {
            if (typeof startTime === 'string') {
                // If startTime is a JSON string (e.g., '["19:36","11:50"]'), parse it
                startTimeArray = JSON.parse(startTime);
                if (!Array.isArray(startTimeArray)) {
                    throw new Error('Parsed startTime is not an array');
                }
            } else if (Array.isArray(startTime)) {
                // If startTime is already an array, use it directly
                startTimeArray = startTime;
            } else {
                throw new Error('startTime must be a stringified array or an array');
            }
            // Ensure all elements are strings
            startTimeArray = startTimeArray.map(time => String(time));
        } catch (parseError) {
            console.error('Error parsing startTime:', parseError);
            return res.status(400).json({ message: 'Invalid startTime format. Expected an array of strings.' });
        }

        const showtime = await Showtime.create({ 
            theaterId, 
            screenId, 
            showName,
            startTime: startTimeArray, 
            duration, 
            Date, 
            status: status || 'avaliable',
            totalSeats,
            avaliableSeats: totalSeats,
            image,
            poster,
            genre: genreArray
        });
        
        res.status(201).json(showtime);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating showtime', 
            error: error instanceof Error ? error.message : error 
        });
    }
};

export const updateShowtime = async (req: any, res: any) => {
    try {
        const { 
            theaterId,
            screenId,
            showName,
            startTime,
            duration,
            Date,
            status,
            totalSeats,
            avaliableSeats,
            genre 
        } = req.body;
        const imageFile = req.files?.image?.[0];
        const posterFile = req.files?.poster?.[0];

        const showtime = await Showtime.findById(req.params.id);
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        if (theaterId) showtime.theaterId = theaterId;
        if (screenId) showtime.screenId = screenId;
        if (showName) showtime.showName = showName;
        if (startTime !== undefined) {
            // Parse startTime to ensure it's an array of strings
            let startTimeArray: string[] = [];
            try {
                if (typeof startTime === 'string') {
                    startTimeArray = JSON.parse(startTime);
                    if (!Array.isArray(startTimeArray)) {
                        throw new Error('Parsed startTime is not an array');
                    }
                } else if (Array.isArray(startTime)) {
                    startTimeArray = startTime;
                } else {
                    throw new Error('startTime must be a stringified array or an array');
                }
                // Ensure all elements are strings
                startTimeArray = startTimeArray.map(time => String(time));
                showtime.startTime = startTimeArray;
            } catch (parseError) {
                console.error('Error parsing startTime:', parseError);
                return res.status(400).json({ message: 'Invalid startTime format. Expected an array of strings.' });
            }
        }
        if (duration) showtime.duration = duration;
        if (Date) showtime.Date = Date;
        if (status) showtime.status = status;
        if (totalSeats !== undefined) showtime.totalSeats = totalSeats;
        if (avaliableSeats !== undefined) showtime.avaliableSeats = avaliableSeats;

        if (genre !== undefined) {
            try {
                const parsedGenre = typeof genre === 'string' ? JSON.parse(genre) : genre;
                if (Array.isArray(parsedGenre)) {
                    showtime.genre = parsedGenre;
                } else {
                    console.log('Invalid genre format:', parsedGenre);
                }
            } catch (parseError) {
                console.error('Error parsing genre:', parseError);
                return res.status(400).json({ message: 'Invalid genre format' });
            }
        }

        if (imageFile) {
            try {
                if (showtime.image?.publicId) {
                    await deleteImage(showtime.image.publicId);
                }
                const uploadResult = await uploadCloudinary(imageFile.path, `showtimes/${showName || showtime.showName}`);
                if (!uploadResult?.public_id || !uploadResult?.url) {
                    throw new Error("Image upload failed");
                }
                showtime.image = {
                    publicId: uploadResult.public_id,
                    url: uploadResult.url
                };
            } catch (uploadError) {
                console.error("Image update failed:", uploadError);
                return res.status(400).json({ message: "Failed to update image" });
            }
        }

        if (posterFile) {
            try {
                if (showtime.poster?.publicId) {
                    await deleteImage(showtime.poster.publicId);
                }
                const uploadResult = await uploadCloudinary(posterFile.path, `showtimes/${showName || showtime.showName}/posters`);
                if (!uploadResult?.public_id || !uploadResult?.url) {
                    throw new Error("Poster upload failed");
                }
                showtime.poster = {
                    publicId: uploadResult.public_id,
                    url: uploadResult.url
                };
            } catch (uploadError) {
                console.error("Poster update failed:", uploadError);
                return res.status(400).json({ message: "Failed to update poster" });
            }
        }

        await showtime.save();

        const populatedShowtime = await Showtime.findById(showtime._id)
            .populate('theaterId')
            .populate('screenId');

        res.json(populatedShowtime);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating showtime', 
            error: error instanceof Error ? error.message : error 
        });
    }
};

// Other functions remain unchanged
export const getAllShowtimes = async (req: any, res: any) => {
    try {
        const showtimes = await Showtime.find()
            .populate('theaterId')
            .populate('screenId');
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching showtimes', 
            error: error instanceof Error ? error.message : error 
        });
    }
};

export const getShowtime = async (req: any, res: any) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('theaterId')
            .populate('screenId');
        
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }
        
        res.json(showtime);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching showtime', 
            error: error instanceof Error ? error.message : error 
        });
    }
};

export const deleteShowtime = async (req: any, res: any) => {
    try {
        const showtime = await Showtime.findByIdAndDelete(req.params.id);
        
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }
        
        if (showtime.image?.publicId) {
            await deleteImage(showtime.image.publicId);
        }
        if (showtime.poster?.publicId) {
            await deleteImage(showtime.poster.publicId);
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting showtime', 
            error: error instanceof Error ? error.message : error 
        });
    }
};

export const getTheaterHallByTheaterOwner = async (req: any, res: any) => {
    try {
        const theater = await Theater.findOne({ owner: req.user.id });
        if (!theater) {
            return res.status(404).json({
                message: 'Theater not found'
            });
        }
        const screen = await Screen.find({ theaterId: theater._id });
        return res.status(200).json({
            message: 'Data fetched successfully',
            data: screen
        });
    } catch (error) {
        res.status(500).json({ 
            message: error instanceof Error ? error.message : error 
        });
    }
};

export const getOnGoingShows = async (req: any, res: any) => {
    try {
        const currentDate = new Date();
        const onGoingShows = await Showtime.find({ Date: { $lte: currentDate } })
            .populate('theaterId')
            .populate('screenId')
            .sort({ Date: -1 });
        return res.status(200).json({
            message: 'Data fetched successfully',
            data: onGoingShows
        });
    } catch (error) {
        res.status(500).json({ 
            message: error instanceof Error ? error.message : error 
        });
    }
};

export const getUpcomingShows = async (req: any, res: any) => {
    try {
        const currentDate = new Date();
        const upcomingShows = await Showtime.find({ Date: { $gt: currentDate } })
            .populate('theaterId')
            .populate('screenId');
        return res.status(200).json({
            message: 'Data fetched successfully',
            data: upcomingShows
        });
    } catch (error) {
        res.status(500).json({ 
            message: error instanceof Error ? error.message : error 
        });
    }
};

export const trendingShows = async (req: any, res: any) => {
    try {
        const currentDate = new Date();

        const onGoingShows = await Showtime.find({ Date: { $lte: currentDate } })
            .populate('theaterId', 'name location')
            .populate('screenId', 'hallName')
            .sort({ Date: -1 });

        if (onGoingShows.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No ongoing shows found',
            });
        }

        const bookingAggregation = await Booking.aggregate([
            { $match: { transactionStatus: { $in: ['Paid', 'Pending'] } } },
            {
                $group: {
                    _id: '$showtimeId',
                    bookingCount: { $sum: 1 },
                },
            },
            { $sort: { bookingCount: -1 } },
            { $limit: 4 },
        ]);

        const topShowtimeIds = bookingAggregation.map(agg => agg._id);

        const trendingShows = onGoingShows.filter((show: any) =>
            topShowtimeIds.includes(show._id.toString())
        );

        if (trendingShows.length < 4) {
            const additionalShows = onGoingShows
                .filter((show: any) => !topShowtimeIds.includes(show._id.toString()))
                .slice(0, 4 - trendingShows.length);
            trendingShows.push(...additionalShows);
        }

        res.status(200).json({
            success: true,
            data: trendingShows,
            message: 'Trending shows retrieved successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'An error occurred',
        });
    }
};