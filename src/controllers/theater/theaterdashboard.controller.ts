import { Request, Response } from 'express';
import Booking from '../../models/booking.model';
import Showtime from '../../models/showtime.model';
import Theater from '../../models/theater.model';
import mongoose from 'mongoose';

// Get Dashboard Overview Data
export const getDashboardOverview = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total Bookings
    const totalBookings = await Booking.countDocuments({ theaterId });

    // Total Revenue
    const revenueStats = await Booking.aggregate([
      { $match: { theaterId: new mongoose.Types.ObjectId(theaterId) } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Average Occupancy
    const theater = await Theater.findById(theaterId);
    const showtimes = await Showtime.find({ theaterId });
    const totalSeats = showtimes.reduce((sum, show) => sum + show.totalSeats, 0);
    const bookedSeats = showtimes.reduce((sum, show: any) => sum + (show.totalSeats - show.availableSeats), 0);
    const avgOccupancy = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

    // Top Performing Movie
    const topMovie = await Booking.aggregate([
      { $match: { theaterId: new mongoose.Types.ObjectId(theaterId) } },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtimeId',
          foreignField: '_id',
          as: 'showtime'
        }
      },
      { $unwind: '$showtime' },
      {
        $group: {
          _id: '$showtime.showName',
          bookings: { $sum: 1 },
          seatsSold: { $sum: { $size: '$seats' } }
        }
      },
      { $sort: { seatsSold: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        totalRevenue: revenueStats[0]?.total || 0,
        avgOccupancy: Number(avgOccupancy.toFixed(1)),
        topMovie: topMovie[0] ? {
          name: topMovie[0]._id,
          seatsSold: topMovie[0].seatsSold
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message:  error instanceof Error ? error.message : error });
  }
};

// Get Revenue Trend Data
export const getRevenueTrend = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const { months = 7 } = req.query;

    const revenueData = await Booking.aggregate([
      { $match: { theaterId: new mongoose.Types.ObjectId(theaterId) } },
      {
        $group: {
          _id: {
            month: { $month: '$bookingDate' },
            year: { $year: '$bookingDate' }
          },
          value: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: Number(months) },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%b',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month'
                }
              }
            }
          },
          value: 1
        }
      }
    ]);

    res.json({ success: true, data: revenueData.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};

// Get Peak Hours Data
export const getPeakHours = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const peakHours = await Booking.aggregate([
      { 
        $match: { 
          theaterId: new mongoose.Types.ObjectId(theaterId),
          bookingDate: { $gte: today }
        } 
      },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtimeId',
          foreignField: '_id',
          as: 'showtime'
        }
      },
      { $unwind: '$showtime' },
      {
        $group: {
          _id: { $arrayElemAt: ['$showtime.startTime', 0] },
          bookings: { $sum: 1 }
        }
      },
      {
        $project: {
          hour: '$_id',
          bookings: 1
        }
      },
      { $sort: { hour: 1 } }
    ]);

    res.json({ success: true, data: peakHours });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};

// Get Category Distribution
export const getCategoryDistribution = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const categories = await Booking.aggregate([
      { 
        $match: { 
          theaterId: new mongoose.Types.ObjectId(theaterId),
          bookingDate: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtimeId',
          foreignField: '_id',
          as: 'showtime'
        }
      },
      { $unwind: '$showtime' },
      { $unwind: '$showtime.genre' },
      {
        $group: {
          _id: '$showtime.genre',
          value: { $sum: 1 }
        }
      }
    ]);

    const total = categories.reduce((sum, cat) => sum + cat.value, 0);
    const categoryData = categories.map(cat => ({
      name: cat._id,
      value: Math.round((cat.value / total) * 100)
    }));

    res.json({ success: true, data: categoryData });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};

// Get Recent Bookings
export const getRecentBookings = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;

    const bookings = await Booking.find({ theaterId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'showtimeId',
        select: 'showName startTime'
      })
      .lean();

    const formattedBookings = bookings.map((booking: any) => ({
      id: booking._id,
      movie: booking.showtimeId.showName,
      showtime: `${new Date().toLocaleDateString()} ${booking.showtimeId.startTime[0]}`,
      seatType: booking.seats[0].seatType,
      amount: `$${booking.totalAmount.toFixed(2)}`
    }));

    res.json({ success: true, data: formattedBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};

// Get Upcoming Shows
export const getUpcomingShows = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const shows = await Showtime.find({
      theaterId,
      Date: { $gte: today, $lt: tomorrow }
    })
      .select('showName startTime status totalSeats availableSeats')
      .sort('Date startTime')
      .lean();

    const upcomingMovies = shows.map(show => ({
      id: show._id,
      title: show.showName,
      time: show.startTime.join(', '),
      status: show.status.charAt(0).toUpperCase() + show.status.slice(1)
    }));

    res.json({ success: true, data: upcomingMovies });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};
