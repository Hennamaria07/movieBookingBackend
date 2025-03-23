import mongoose from 'mongoose';
import Booking from '../../models/booking.model';
import Theater from '../../models/theater.model';

// Interfaces (matching your frontend types)
interface Transaction {
  id: string;
  userName: string;
  theaterName: string;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  date: string;
}

interface TheaterCommission {
  theaterName: string;
  ticketPercentage: number;
  fixedFee: number;
  totalEarned: number;
  pendingApproval: boolean;
}

export const getTransactions = async (req: any, res: any) => {
    try {
      const { date, status, paymentMethod } = req.query;
  
      const filter: any = {};
      if (date) filter.bookingDate = new Date(date as string);
      if (status && status !== 'all') filter.transactionStatus = status;
      if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;
  
      const bookings = await Booking.find(filter)
        .populate('userId', 'firstName lastName')
        .populate('theaterId', 'name')
        .lean();
  
      const transactions: Transaction[] = bookings.map((booking: any) => ({
        id: booking.paymentId || booking._id.toString(),
        userName: `${booking.userId.firstName} ${booking.userId.lastName}`,
        theaterName: booking.theaterId.name,
        amount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        status: booking.transactionStatus === 'Paid' ? 'Completed' : booking.transactionStatus,
        date: booking.bookingDate ? booking.bookingDate.toISOString().split('T')[0] : booking.createdAt.toISOString().split('T')[0]
      }));
  
      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : error
      });
    }
  };
  
  // Get theater commissions
  export const getTheaterCommissions = async (req: any, res: any) => {
    try {
      const theaters = await Theater.find({ status: 'Active' }).lean();
      
      const commissions = await Promise.all(theaters.map(async (theater) => {
        const bookings = await Booking.find({
          theaterId: theater._id,
          transactionStatus: 'Paid'
        }).lean();
  
        const totalEarned = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        
        // These values could be stored in a separate commission model or configuration
        const ticketPercentage = 8.5; // Default value, could be theater-specific
        const fixedFee = 250; // Default value, could be theater-specific
  
        return {
          theaterName: theater.name,
          ticketPercentage,
          fixedFee,
          totalEarned: totalEarned * (ticketPercentage / 100) + fixedFee,
          pendingApproval: false // Could track pending changes in a separate model
        };
      }));
  
      res.status(200).json({
        success: true,
        data: commissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : error,
      });
    }
  };
  
  // Update theater commission
  export const updateTheaterCommission = async (req: any, res: any) => {
    try {
      const { theaterId, ticketPercentage, fixedFee } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(theaterId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid theater ID'
        });
      }
  
      const theater = await Theater.findById(theaterId);
      if (!theater) {
        return res.status(404).json({
          success: false,
          message: 'Theater not found'
        });
      }
  
      // Here you might want to:
      // 1. Save to a separate Commission model
      // 2. Add to a pending approval queue
      // 3. Update directly based on your business logic
  
      // For this example, we'll return the updated commission
      const bookings = await Booking.find({
        theaterId: theater._id,
        transactionStatus: 'Paid'
      }).lean();
  
      const totalEarned = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  
      const updatedCommission: TheaterCommission = {
        theaterName: theater.name,
        ticketPercentage,
        fixedFee,
        totalEarned: totalEarned * (ticketPercentage / 100) + fixedFee,
        pendingApproval: true
      };
  
      res.status(200).json({
        success: true,
        data: updatedCommission
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : error
      });
    }
  };
  
  // Get revenue analytics
  export const getRevenueAnalytics = async (req: any, res: any) => {
    try {
      const { period = 'monthly' } = req.query; // Could be 'daily', 'monthly', 'yearly'
  
      const bookings = await Booking.find({ transactionStatus: 'Paid' })
        .lean();
  
      // Aggregate revenue by month (simplified example)
      const revenueByMonth = bookings.reduce((acc: any, booking) => {
        const date = new Date(booking.bookingDate || booking.createdAt);
        const month = date.toLocaleString('default', { month: 'short' });
        
        acc[month] = (acc[month] || 0) + booking.totalAmount;
        return acc;
      }, {});
  
      const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue
      }));
  
      // Calculate payment method distribution
      const paymentMethods = bookings.reduce((acc: any, booking) => {
        acc[booking.paymentMethod] = (acc[booking.paymentMethod] || 0) + 1;
        return acc;
      }, {});
  
      const paymentMethodData = Object.entries(paymentMethods).map(([name, value]) => ({
        name,
        value
      }));
  
      // Calculate refund rate
      const totalBookings = await Booking.countDocuments();
      const refundedBookings = await Booking.countDocuments({ transactionStatus: 'Refunded' });
      const refundRate = totalBookings > 0 ? (refundedBookings / totalBookings) * 100 : 0;
  
      res.status(200).json({
        success: true,
        data: {
          revenueTrend: revenueData,
          paymentMethods: paymentMethodData,
          anomalies: refundRate > 5 ? [{
            message: `High refund rate detected: ${refundRate.toFixed(1)}%`,
            severity: 'warning'
          }] : []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : error
      });
    }
  };
  
  // Export report
  export const exportReport = async (req: any, res: any) => {
    try {
      const { format = 'csv' } = req.query;
  
      const bookings = await Booking.find()
        .populate('userId', 'firstName lastName')
        .populate('theaterId', 'name')
        .lean();
  
      if (format === 'csv') {
        const csvData = [
          'ID,User,Theater,Amount,Payment Method,Status,Date',
          ...bookings.map((b: any) => `${b.paymentId || b._id},${b.userId.firstName} ${b.userId.lastName},${b.theaterId.name},${b.totalAmount},${b.paymentMethod},${b.transactionStatus},${b.bookingDate || b.createdAt}`)
        ].join('\n');
  
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="finance_report.csv"');
        return res.status(200).send(csvData);
      }
  
      // Add PDF generation logic here if needed
      res.status(200).json({
        success: true,
        message: `${format} export generated successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : error
      });
    }
  };

