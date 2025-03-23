import mongoose from "mongoose";
import Booking from "../../models/booking.model";
import Showtime from "../../models/showtime.model";
import Theater from "../../models/theater.model";

// Helper function to get date range
const getDateRange = (range: string) => {
  const now = new Date();
  switch (range) {
    case 'daily':
      return { start: new Date(now.setHours(0,0,0,0)), end: new Date(now.setHours(23,59,59,999)) };
    case 'weekly':
      return { start: new Date(now.setDate(now.getDate() - 6)), end: new Date() };
    case 'monthly':
      return { start: new Date(now.setMonth(now.getMonth() - 1)), end: new Date() };
    default:
      return { start: new Date(now.setDate(now.getDate() - 6)), end: new Date() };
  }
};

// Sales Reports Controller
export const getSalesReport = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const { timeRange = 'weekly' } = req.query;
    const { start, end } = getDateRange(timeRange);

    const bookings = await Booking.aggregate([
      { $match: { 
        theater: new mongoose.Types.ObjectId(theaterId),
        createdAt: { $gte: start, $lte: end }
      }},
      { $group: {
        _id: { $dayOfWeek: '$createdAt' },
        revenue: { $sum: '$totalAmount' },
        tickets: { $sum: { $size: '$seats' } }
      }},
      { $sort: { '_id': 1 } }
    ]);

    const salesData = bookings.map(booking => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][booking._id - 1],
      revenue: booking.revenue,
      tickets: booking.tickets
    }));

    // Calculate totals
    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalTickets = salesData.reduce((sum, item) => sum + item.tickets, 0);
    const refunds = await Booking.countDocuments({
      theater: theaterId,
      status: 'refunded',
      createdAt: { $gte: start, $lte: end }
    });

    res.json({
      success: true,
      data: {
        salesData,
        totalRevenue,
        totalTickets,
        refundsProcessed: refunds
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};

// Demographics Report Controller
export const getDemographicsReport = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const { start, end } = getDateRange('monthly');

    // Age distribution
    const ageDistribution = await Booking.aggregate([
      { $match: { 
        theater: new mongoose.Types.ObjectId(theaterId),
        createdAt: { $gte: start, $lte: end }
      }},
      { $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }},
      { $unwind: '$userInfo' },
      { $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $lte: ['$userInfo.age', 24] }, then: '18-24' },
              { case: { $lte: ['$userInfo.age', 34] }, then: '25-34' },
              { case: { $lte: ['$userInfo.age', 44] }, then: '35-44' },
              { case: { $lte: ['$userInfo.age', 54] }, then: '45-54' },
            ],
            default: '55+'
          }
        },
        value: { $sum: 1 }
      }},
      { $project: {
        name: '$_id',
        value: 1,
        _id: 0,
        color: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', '18-24'] }, then: '#FF6384' },
              { case: { $eq: ['$_id', '25-34'] }, then: '#36A2EB' },
              { case: { $eq: ['$_id', '35-44'] }, then: '#FFCE56' },
              { case: { $eq: ['$_id', '45-54'] }, then: '#4BC0C0' },
            ],
            default: '#9966FF'
          }
        }
      }}
    ]);

    // Location distribution
    const locationDistribution = await Booking.aggregate([
      { $match: { 
        theater: new mongoose.Types.ObjectId(theaterId),
        createdAt: { $gte: start, $lte: end }
      }},
      { $group: {
        _id: '$locationArea', // Assuming bookings have a locationArea field
        value: { $sum: 1 }
      }},
      { $project: {
        name: '$_id',
        value: 1,
        _id: 0,
        color: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 'Downtown'] }, then: '#FF6384' },
              { case: { $eq: ['$_id', 'Uptown'] }, then: '#36A2EB' },
              { case: { $eq: ['$_id', 'Suburbs'] }, then: '#FFCE56' },
            ],
            default: '#4BC0C0'
          }
        }
      }}
    ]);

    // Engagement metrics
    const returnRate = await Booking.distinct('user', {
      theater: theaterId,
      createdAt: { $gte: start, $lte: end }
    }).then(users => {
      const totalUsers = users.length;
      const returningUsers = users.filter(async(user: any) => {
        const count = await Booking.countDocuments({ user, theater: theaterId }).exec();
        return count > 1;
      }).length;
      return (returningUsers / totalUsers * 100).toFixed(1);
    });

    const avgVisits = await Booking.aggregate([
      { $match: { theater: new mongoose.Types.ObjectId(theaterId) }},
      { $group: { _id: '$user', visits: { $sum: 1 }}},
      { $group: { _id: null, avgVisits: { $avg: '$visits' }}}
    ]);

    res.json({
      success: true,
      data: {
        ageDistribution,
        locationDistribution,
        engagement: {
          returnRate,
          avgVisits: avgVisits[0]?.avgVisits.toFixed(1) || 0,
          satisfactionScore: 4.8 // This would need a separate ratings collection
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};

// Peak Hours Controller
export const getPeakHoursReport = async (req: any, res: any) => {
  try {
    const { theaterId } = req.params;
    const { start, end } = getDateRange('daily');

    // Peak hours
    const peakHours = await Booking.aggregate([
      { $match: { 
        theater: new mongoose.Types.ObjectId(theaterId),
        createdAt: { $gte: start, $lte: end }
      }},
      { $group: {
        _id: { $hour: '$createdAt' },
        tickets: { $sum: { $size: '$seats' } }
      }},
      { $sort: { '_id': 1 } },
      { $project: {
        time: { $concat: [{ $toString: '$_id' }, ':00'] },
        tickets: 1,
        _id: 0
      }}
    ]);

    // Popular movie times
    const popularMovieTimes = await Booking.aggregate([
      { $match: { 
        theater: new mongoose.Types.ObjectId(theaterId),
        createdAt: { $gte: start, $lte: end }
      }},
      { $lookup: {
        from: 'showtimes',
        localField: 'showtime',
        foreignField: '_id',
        as: 'showtimeInfo'
      }},
      { $unwind: '$showtimeInfo' },
      { $lookup: {
        from: 'movies',
        localField: 'showtimeInfo.movie',
        foreignField: '_id',
        as: 'movieInfo'
      }},
      { $unwind: '$movieInfo' },
      { $group: {
        _id: '$movieInfo.title',
        morning: { 
          $sum: { 
            $cond: [{ $and: [
              { $gte: [{ $hour: '$showtimeInfo.startTime' }, 10] },
              { $lte: [{ $hour: '$showtimeInfo.startTime' }, 14] }
            ]}, { $size: '$seats' }, 0] 
          }
        },
        afternoon: { 
          $sum: { 
            $cond: [{ $and: [
              { $gte: [{ $hour: '$showtimeInfo.startTime' }, 14] },
              { $lte: [{ $hour: '$showtimeInfo.startTime' }, 18] }
            ]}, { $size: '$seats' }, 0] 
          }
        },
        evening: { 
          $sum: { 
            $cond: [{ $and: [
              { $gte: [{ $hour: '$showtimeInfo.startTime' }, 18] },
              { $lte: [{ $hour: '$showtimeInfo.startTime' }, 22] }
            ]}, { $size: '$seats' }, 0] 
          }
        }
      }},
      { $project: {
        movie: '$_id',
        morning: 1,
        afternoon: 1,
        evening: 1,
        _id: 0
      }}
    ]);

    // Capacity utilization
    const capacityUtilization = await Showtime.aggregate([
      { $match: { 
        theater: new mongoose.Types.ObjectId(theaterId),
        startTime: { $gte: start, $lte: end }
      }},
      { $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'showtime',
        as: 'bookings'
      }},
      { $group: {
        _id: { $dayOfWeek: '$startTime' },
        totalSeats: { $sum: '$totalSeats' },
        bookedSeats: { $sum: { $sum: '$bookings.seats.length' } }
      }},
      { $project: {
        day: { $arrayElemAt: [['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], { $subtract: ['$_id', 1] }] },
        utilization: { $multiply: [{ $divide: ['$bookedSeats', '$totalSeats'] }, 100] }
      }},
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        peakHours,
        popularMovieTimes,
        capacityUtilization
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : error });
  }
};
