import { Request, Response } from 'express';
import Theater from '../../models/theater.model';
import deleteImage from '../../utils/destoryCloudinaryImage';
import uploadCloudinary from '../../utils/uploadOnCloudinary';
import { validateScreenData } from '../../utils/validation';
import Screen from '../../models/screen.model';
import { ObjectId } from 'mongoose';

export const createTheater = async (req: any, res: Response) => {
  try {
    const imageFile = req.file;
    const response = await uploadCloudinary(imageFile?.path || '', req.body.owner);
    const theater = await Theater.create({
      ...req.body,
      amenities: req.body.amenities && typeof req.body.amenities === 'string'
        ? JSON.parse(req.body.amenities)
        : req.body.amenities,
      image: {
        publicId: response.public_id,
        url: response.url
      }
    });
    res.status(201).json({
      message: 'Theater created successfully',
      data: theater
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTheaterById = async (req: any, res: Response) => {
  try {
    console.log(req?.params?.id);
    const theater = await Theater.findOne({ owner: req?.params?.id })
    res.status(200).json({
      message: 'Theater fetched successfully',
      data: theater
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTheater = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const imageFile = req.file; // Assuming you're using multer for file uploads

    // Find the theater
    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    // Handle image update if a new file is provided
    if (imageFile) {
      // Delete old image from Cloudinary if it exists
      if (theater.image?.publicId) {
        await deleteImage(theater.image.publicId);
      }

      // Upload new image to Cloudinary
      const response = await uploadCloudinary(imageFile.path, req.body.owner);

      // Update theater image object
      theater.image = {
        publicId: response.public_id,
        url: response.url
      };
    }

    // Parse amenities if it’s a string, otherwise use as-is
    const updates = {
      ...req.body,
      amenities: req.body.amenities && typeof req.body.amenities === 'string'
        ? JSON.parse(req.body.amenities)
        : req.body.amenities
    };
    delete updates.owner; // Prevent owner modification

    // Update theater fields
    Object.assign(theater, updates);

    // Save the updated theater
    await theater.save();

    res.json({
      message: 'Theater updated successfully',
      theater: theater
    });

  } catch (error) {
    console.error('Error updating theater:', error);
    res.status(500).json({
      message: 'Error updating theater',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createScreen = async (req: any, res: any) => {
  try {
    const { theaterId, name, rows, seatsPerRow, seatCategories, specialSeats } = req.body;

    // Validate theater existence and ownership
    const theater = await Theater.findById(theaterId);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    // if (theater.owner.toString() !== req.user?.id) { // Assuming req.user from auth middleware
    //   return res.status(403).json({ message: 'Not authorized to add screens to this theater' });
    // }

    // Validate input data (reusing utility from previous response)
    const validationError = validateScreenData({
      hallName: name,
      rows,
      seatsPerRow,
      seatCategories: seatCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        defaultPrice: cat.defaultPrice,
        color: cat.color,
      })),
      specialSeats,
    });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Check for duplicate hall name
    const existingScreen: any = await Screen.findOne({ theaterId, hallName: name });
    if (existingScreen) {
      return res.status(400).json({ message: 'A screen with this name already exists in the theater' });
    }

    // Prepare screen data
    const screenData = {
      theaterId,
      hallName: name,
      rows,
      seatsPerRow,
      seatCategories: seatCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        price: cat.defaultPrice, // Map frontend defaultPrice to backend price
        color: cat.color,
      })),
      specialSeats: specialSeats.map((seat: any) => ({
        row: seat.row,
        seat: seat.seat,
        categoryId: seat.category, // Map frontend category to backend categoryId
      })),
      totalSeats: rows * seatsPerRow,
    };

    const screen = await Screen.create(screenData);
    theater.screens.push(screen._id as ObjectId);
    await theater.save();
    res.status(201).json({
      message: 'Screen created successfully',
      data: {
        id: screen._id,
        name: screen.hallName,
        rows: screen.rows,
        seatsPerRow: screen.seatsPerRow,
        totalCapacity: screen.totalSeats,
        seatCategories: screen.seatCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          defaultPrice: cat.price, // Map back for frontend
          color: cat.color,
        })),
        specialSeats: screen.specialSeats.map((seat) => ({
          row: seat.row,
          seat: seat.seat,
          category: seat.categoryId, // Map back for frontend
        })),
      },
    });
  } catch (error: any) {
    console.error('Error creating screen:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getScreensByTheater = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    console.log(theaterId)

    const theater = await Theater.findOne({
      $or: [{ _id: theaterId }, { owner: theaterId }]
    }).populate('screens');

    // console.log(theater, '<===theater')

    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    // if (theater.owner.toString() !== req.user?.id) {
    //   return res.status(403).json({ message: 'Not authorized to view screens for this theater' });
    // }
    const data = theater?.screens.map((screen: any) => ({
      id: screen._id,
      name: screen.hallName,
      rows: screen.rows,
      seatsPerRow: screen.seatsPerRow,
      totalCapacity: screen.totalSeats,
      seatCategories: screen.seatCategories.map((cat: {id: string, name: string, price: number, color: string}) => ({
        id: cat.id,
        name: cat.name,
        defaultPrice: cat.price,
        color: cat.color,
      })),
      specialSeats: screen.specialSeats.map((seat: { row: number; seat: number; categoryId: string }) => ({
        row: seat.row,
        seat: seat.seat,
        category: seat.categoryId,
      })),
    }))
      // console.log(data, '<====data')
    res.status(200).json({
      message: 'Screens fetched successfully',
      data: data
    });
  } catch (error: any) {
    console.error('Error fetching screens:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a screen
// @route   PATCH /api/screens/:id
// @access  Private (Theater Admin)
export const screenController = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const {
      action, // New parameter to determine which operation to perform
      row,
      seat,
      category,
      categoryId,
      defaultPrice,
      name,
      rows,
      seatsPerRow,
      seatCategories,
      specialSeats,
    } = req.body;

    // Find the screen
    const screen = await Screen.findById(id);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }

    // console.log(req.user, '<===')

    // Authorization check
    const theater = await Theater.findById(screen.theaterId);
    if (!theater || theater.owner.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Not authorized to modify this screen' });
    }

    // Handle different actions
    switch (action) {
      case 'assignSeat':
        if (!row || !seat || !category) {
          return res.status(400).json({ message: 'Missing required fields: row, seat, or category' });
        }

        await screen.assignSeatToCategory(row, seat, category);

        return res.status(200).json({
          message: `Seat at row ${row}, seat ${seat} assigned to category ${category}`,
          data: { row, seat, category },
        });

      case 'updatePrice':
        if (!categoryId || !defaultPrice) {
          return res.status(400).json({ message: 'Missing required fields: categoryId or defaultPrice' });
        }

        await screen.updateCategoryPrice(categoryId, defaultPrice);

        return res.status(200).json({
          message: `Price for category ${categoryId} updated to $${defaultPrice}`,
          data: { categoryId, defaultPrice },
        });

      case 'updateScreen':
        // Validate input data
        const validationError = validateScreenData({
          hallName: name,
          rows,
          seatsPerRow,
          seatCategories: seatCategories?.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            defaultPrice: cat.defaultPrice,
            color: cat.color,
          })),
          specialSeats,
        });
        if (validationError) {
          return res.status(400).json({ message: validationError });
        }

        // Check for duplicate hall name
        if (name) {
          const duplicateScreen = await Screen.findOne({
            theaterId: screen.theaterId,
            hallName: name,
            _id: { $ne: id },
          });
          if (duplicateScreen) {
            return res.status(400).json({ message: 'A screen with this name already exists in the theater' });
          }
          screen.hallName = name;
        }

        // Update screen fields
        screen.rows = rows || screen.rows;
        screen.seatsPerRow = seatsPerRow || screen.seatsPerRow;
        screen.totalSeats = screen.rows * screen.seatsPerRow;

        if (seatCategories) {
          screen.seatCategories = seatCategories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            price: cat.defaultPrice,
            color: cat.color,
          }));
        }
        if (specialSeats) {
          screen.specialSeats = specialSeats.map((seat: any) => ({
            row: seat.row,
            seat: seat.seat,
            categoryId: seat.category,
          }));
        }

        const updatedScreen = await screen.save();

        return res.status(200).json({
          message: 'Screen updated successfully',
          data: {
            id: updatedScreen._id,
            name: updatedScreen.hallName,
            rows: updatedScreen.rows,
            seatsPerRow: updatedScreen.seatsPerRow,
            totalCapacity: updatedScreen.totalSeats,
            seatCategories: updatedScreen.seatCategories.map((cat) => ({
              id: cat.id,
              name: cat.name,
              defaultPrice: cat.price,
              color: cat.color,
            })),
            specialSeats: updatedScreen.specialSeats.map((seat) => ({
              row: seat.row,
              seat: seat.seat,
              category: seat.categoryId,
            })),
          },
        });

      default:
        return res.status(400).json({ message: 'Invalid action specified' });
    }
  } catch (error: any) {
    console.error(`Error in screenController (${req.body.action}):`, error);
    res.status(500).json({
      message: error.message,
      error: error.message,
    });
  }
};

// @desc    Delete a screen
// @route   DELETE /api/screens/:id
// @access  Private (Theater Admin)
export const deleteScreen = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const screen = await Screen.findById(id);
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found' });
    }

    const theater = await Theater.findById(screen.theaterId);
    theater!.screens = theater!.screens.filter((screen: any) => screen.toString() !== id.toString());
    await theater!.save();

    await Screen.deleteOne({ _id: id });

    res.status(200).json({
      message: 'Screen deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting screen:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getAllTheaters = async(req: any, res: any) => {
  try {
    const theaters = await Theater.find({}).populate('screens');

    res.status(200).json({
      message: 'Theaters fetched successfully',
      data: theaters,
    });
} catch(error) {
    res.status(500).json({ 
        message: error instanceof Error ? error.message : error, 
    });
}
};