import Razorpay from "razorpay";
import Booking from "../../models/booking.model";
import Showtime from "../../models/showtime.model";
import mongoose from "mongoose";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const createBooking = async (req: any, res: any) => {
  try {
    const { showtimeId, seats, userId, theaterId, bookingDate } = req.body;

    // Validate required fields
    if (!showtimeId || !seats || !userId || !theaterId || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Calculate total amount
    const totalAmount = seats.reduce(
      (sum: number, seat: any) => sum + seat.price * seat.totalSeats,
      0
    );

    // Fetch and validate showtime
    const showtime:any = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ success: false, message: "Showtime not found" });
    }

    const requestedSeats = seats.map((seat: any) => {
      const rowStr = seat.seatNumber.match(/[A-Za-z]+/)?.[0];
      const seatStr = seat.seatNumber.match(/\d+/)?.[0];
      if (!rowStr || !seatStr) {
        throw new Error(`Invalid seatNumber format: ${seat.seatNumber}`);
      }
      const row = rowStr.charCodeAt(0) - "A".charCodeAt(0) + 1;
      const seatNum = parseInt(seatStr);
      return { row, seat: seatNum, categoryId: seat.seatType };
    });

    const alreadyBooked = showtime.bookedSeat.some((booked: any) =>
      requestedSeats.some(
        (reqSeat: any) => reqSeat.row === booked.row && reqSeat.seat === booked.seat
      )
    );

    if (alreadyBooked || showtime.avaliableSeats < seats.length) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already booked or unavailable",
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `pre_booking_${Date.now()}`,
      notes: { showtimeId, userId, theaterId, seats: JSON.stringify(seats), bookingDate },
    });

    // Initialize tempBookedSeats if undefined and push seats
    showtime.tempBookedSeats = showtime.tempBookedSeats || [];
    showtime.tempBookedSeats.push(...requestedSeats.map((seat: any) => ({ ...seat, orderId: order.id })));
    await showtime.save();

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      message: "Proceed to payment",
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error initiating booking",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const confirmPayment = async (req: any, res: any) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Fetch the order from Razorpay to get notes
    const order:any = await razorpay.orders.fetch(razorpay_order_id);
    const { showtimeId, userId, theaterId, seats, bookingDate } = order.notes;

    // Verify payment signature
    const crypto = await import("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      const showtime: any = await Showtime.findById(showtimeId);
      if (showtime) {
        // Safely filter tempBookedSeats, defaulting to empty array if undefined
        showtime.tempBookedSeats = (showtime.tempBookedSeats || []).filter(
          (seat: any) => seat.orderId !== razorpay_order_id
        );
        await showtime.save();
      }
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Parse seats
    const parsedSeats = JSON.parse(seats);
    const totalAmount = parsedSeats.reduce(
      (sum: number, seat: any) => sum + seat.price * seat.totalSeats,
      0
    );

    // Fetch and update showtime
    const showtime: any = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ success: false, message: "Showtime not found" });
    }

    const requestedSeats = parsedSeats.map((seat: any) => {
      const rowStr = seat.seatNumber.match(/[A-Za-z]+/)?.[0];
      const seatStr = seat.seatNumber.match(/\d+/)?.[0];
      const row = rowStr.charCodeAt(0) - "A".charCodeAt(0) + 1;
      const seatNum = parseInt(seatStr);
      return { row, seat: seatNum, categoryId: seat.seatType };
    });

    // Move temp booked seats to permanent
    showtime.bookedSeat.push(...requestedSeats);
    // Safely filter tempBookedSeats, defaulting to empty array if undefined
    showtime.tempBookedSeats = (showtime.tempBookedSeats || []).filter(
      (seat: any) => seat.orderId !== razorpay_order_id
    );
    showtime.avaliableSeats -= parsedSeats.length;

    if (showtime.avaliableSeats === 0) {
      showtime.status = "sold out";
    } else if (showtime.avaliableSeats < showtime.totalSeats * 0.2) {
      showtime.status = "high demand";
    }
    await showtime.save();

    // Create new booking document
    const booking = await Booking.create({
      userId,
      theaterId,
      showtimeId,
      seats: parsedSeats,
      totalAmount,
      paymentMethod: "razorpay",
      paymentIntentId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionStatus: "Paid",
      bookingDate,
    });

    res.status(200).json({
      success: true,
      data: booking,
      message: "Payment confirmed and booking created successfully",
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error confirming payment",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const confirmModifyPayment = async (req: any, res: any) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = req.body;

    // Fetch the order from Razorpay to get notes
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { bookingId: orderBookingId } = order.notes as any;

    if (orderBookingId !== bookingId) {
      return res.status(400).json({ success: false, message: "Invalid order for this booking" });
    }

    // Verify payment signature
    const crypto = await import("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Update booking status
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.transactionStatus = "Paid";
    booking.paymentId = razorpay_payment_id; // Update with new payment ID if needed
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: "Payment confirmed and booking updated successfully",
    });
  } catch (error) {
    console.error("Confirm modify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error confirming payment",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const refundBooking = async (req: any, res: any) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("showtimeId");
    if (!booking || !booking.paymentId) {
      return res.status(404).json({
        success: false,
        message: "Booking or payment not found",
      });
    }

    if (booking.transactionStatus !== "Paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot refund unpaid booking",
      });
    }

    const refund = await razorpay.payments.refund(booking.paymentId, {
      amount: booking.totalAmount * 100, // In paise
    });

    // Update booking, preserving bookingDate
    booking.transactionStatus = "Refunded"; // Removed invalid 'status' field

    // Update Showtime model
    const showtime = booking.showtimeId as any;
    const refundedSeats = booking.seats.map((seat: any) => {
      const rowStr = seat.seatNumber.match(/[A-Za-z]+/)?.[0];
      const seatStr = seat.seatNumber.match(/\d+/)?.[0];
      const row = rowStr!.charCodeAt(0) - "A".charCodeAt(0) + 1;
      const seatNum = parseInt(seatStr!);
      return { row, seat: seatNum, categoryId: seat.seatType };
    });

    showtime.bookedSeat = showtime.bookedSeat.filter(
      (booked: any) =>
        !refundedSeats.some(
          (refSeat: any) =>
            refSeat.row === booked.row &&
            refSeat.seat === booked.seat &&
            refSeat.categoryId === booked.categoryId
        )
    );
    showtime.avaliableSeats += booking.seats.length;

    // Update showtime status
    if (showtime.avaliableSeats === showtime.totalSeats) {
      showtime.status = "avaliable";
    } else if (showtime.avaliableSeats > showtime.totalSeats * 0.2) {
      showtime.status = "avaliable";
    } else {
      showtime.status = "high demand";
    }

    await showtime.save();
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: "Booking refunded successfully",
    });
  } catch (error) {
    console.error("Refund booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error refunding booking",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAllBookings = async (req: any, res: any) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email")
      .populate("theaterId", "name location")
      .populate("showtimeId", "showName Date startTime endTime image"); // Updated population fields

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getAllBookedShowsByUser = async (req: any, res: any) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const bookings = await Booking.find({ userId })
      .populate("userId", "name email")
      .populate("theaterId", "name location")
      .populate("showtimeId", "showName Date startTime endTime image"); // Updated population fields

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getBookingById = async (req: any, res: any) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate("theaterId", "name location")
      .populate("showtimeId", "showName Date startTime endTime image"); // Updated population fields

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const modifyBooking = async (req: any, res: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;
    const { seats } = req.body;

    if (!seats || !Array.isArray(seats)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Seats must be provided as an array",
      });
    }

    const booking: any = await Booking.findById(bookingId)
      .populate({
        path: "showtimeId",
        populate: { path: "screenId" },
      })
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.transactionStatus !== "Paid") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Can only modify confirmed bookings",
      });
    }

    const showtime = booking.showtimeId as any;
    if (!showtime || !showtime.screenId || !showtime.screenId.seatCategories) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Showtime screen data is missing",
        details: {
          showtime: showtime ? "present" : "missing",
          screenId: showtime?.screenId ? "present" : "missing",
          seatCategories: showtime?.screenId?.seatCategories ? "present" : "missing",
        },
      });
    }

    const seatCategories = showtime.screenId.seatCategories.reduce((acc: any, cat: any) => {
      acc[cat.id] = { price: cat.price, name: cat.name };
      return acc;
    }, {});

    const newRequestedSeats = seats.map((seat: any) => {
      const seatNumber = typeof seat === "string" ? seat : seat.seatNumber;
      const rowStr = seatNumber.match(/[A-Za-z]+/)?.[0];
      const seatStr = seatNumber.match(/\d+/)?.[0];
      if (!rowStr || !seatStr) {
        throw new Error(`Invalid seat format: ${seatNumber}`);
      }
      const row = rowStr.charCodeAt(0) - "A".charCodeAt(0) + 1;
      const seatNum = parseInt(seatStr);

      const specialSeat = showtime.screenId.specialSeats.find(
        (ss: any) => ss.row === row && ss.seat === seatNum
      );
      const categoryId = specialSeat ? specialSeat.categoryId : "regular";

      return { row, seat: seatNum, categoryId };
    });

    const alreadyBooked = showtime.bookedSeat.some((booked: any) =>
      newRequestedSeats.some(
        (reqSeat: any) =>
          reqSeat.row === booked.row &&
          reqSeat.seat === booked.seat &&
          !booking.seats.some(
            (oldSeat: any) => oldSeat.seatNumber === `${String.fromCharCode(reqSeat.row + 64)}${reqSeat.seat}`
          )
      )
    );

    if (alreadyBooked) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Some of the selected seats are already booked",
      });
    }

    const oldSeats = booking.seats.map((seat: any) => {
      const rowStr = seat.seatNumber.match(/[A-Za-z]+/)?.[0];
      const seatStr = seat.seatNumber.match(/\d+/)?.[0];
      const row = rowStr!.charCodeAt(0) - "A".charCodeAt(0) + 1;
      const seatNum = parseInt(seatStr!);
      return { row, seat: seatNum, categoryId: seat.seatType };
    });

    showtime.bookedSeat = showtime.bookedSeat.filter((booked: any) =>
      !oldSeats.some((oldSeat: any) => oldSeat.row === booked.row && oldSeat.seat === booked.seat)
    );

    showtime.bookedSeat.push(...newRequestedSeats);
    showtime.avaliableSeats = showtime.avaliableSeats + booking.seats.length - seats.length;

    if (showtime.avaliableSeats === showtime.totalSeats) {
      showtime.status = "avaliable";
    } else if (showtime.avaliableSeats > showtime.totalSeats * 0.2) {
      showtime.status = "avaliable";
    } else {
      showtime.status = "high demand";
    }

    const oldTotalAmount = booking.totalAmount;

    const newSeatsDetails = seats.map((seat: any) => {
      const seatNumber = typeof seat === "string" ? seat : seat.seatNumber;
      const rowStr = seatNumber.match(/[A-Za-z]+/)?.[0];
      const seatStr = seatNumber.match(/\d+/)?.[0];
      const row = rowStr!.charCodeAt(0) - "A".charCodeAt(0) + 1;
      const seatNum = parseInt(seatStr!);

      const specialSeat = showtime.screenId.specialSeats.find(
        (ss: any) => ss.row === row && ss.seat === seatNum
      );
      const seatType = specialSeat ? specialSeat.categoryId : "regular";
      const price = seatCategories[seatType]?.price || 0;

      return {
        seatNumber,
        price,
        totalSeats: 1,
        seatType,
      };
    });

    const newTotalAmount = newSeatsDetails.reduce(
      (total: number, seat: any) => total + seat.price * seat.totalSeats,
      0
    );

    const priceDifference = newTotalAmount - oldTotalAmount;

    let paymentResponse: any = null;

    if (priceDifference > 0) {
      const amountInPaise = priceDifference * 100; // Convert INR to paise for Razorpay

      const shortBookingId = bookingId.slice(0, 8);
      const shortTimestamp = Date.now().toString().slice(-6);
      const receipt = `mod_${shortBookingId}_${shortTimestamp}`;

      console.log(`Generated receipt: ${receipt} (length: ${receipt.length})`);

      if (receipt.length > 40) {
        throw new Error("Generated receipt exceeds 40 characters");
      }

      const order = await razorpay.orders.create({
        amount: amountInPaise, // Amount in paise
        currency: "INR",
        receipt,
        notes: { bookingId, action: "additional_payment" },
      });

      booking.totalAmount = newTotalAmount;
      booking.seats = newSeatsDetails;
      booking.transactionStatus = "Pending";

      await showtime.save({ session });
      await booking.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        data: booking,
        order: {
          id: order.id,
          amount: order.amount, // Amount in paise (e.g., 34400 for 344 INR)
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
        message: `Additional payment of ₹${priceDifference} required. Please complete the payment.`,
      });
    } else if (priceDifference < 0) {
      const refundAmount = Math.abs(priceDifference) * 100; // Convert INR to paise for Razorpay refund
      const refund = await razorpay.payments.refund(booking.paymentId, {
        amount: refundAmount,
      });

      booking.totalAmount = newTotalAmount;
      booking.seats = newSeatsDetails;
      paymentResponse = refund;
    } else {
      booking.totalAmount = newTotalAmount;
      booking.seats = newSeatsDetails;
    }

    await showtime.save({ session });
    await booking.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: booking,
      refund: paymentResponse ? { id: paymentResponse.id, amount: paymentResponse.amount } : null,
      message:
        priceDifference < 0
          ? `Booking modified successfully. Refund of ₹${Math.abs(priceDifference)} processed.`
          : `Booking modified successfully. Total amount: ₹${newTotalAmount}`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Modify booking error:", error);

    if (error instanceof Error && "code" in error && error.code === "BAD_REQUEST_ERROR") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment request",
        error: error.message || error,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error modifying booking",
      error: error instanceof Error ? error.message : error,
    });
  } finally {
    session.endSession();
  }
};

export const cancelBooking = async (req: any, res: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate("showtimeId").session(session);
    if (!booking || !booking.paymentId) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Booking or payment not found",
      });
    }

    if (booking.transactionStatus !== "Paid") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a booking that is not paid",
      });
    }

    // Fetch payment details from Razorpay to get the captured amount
    const payment: any = await razorpay.payments.fetch(booking.paymentId);
    if (!payment || payment.status !== "captured") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Payment not found or not captured",
      });
    }

    const refundableAmount = payment.amount - (payment.amount_refunded || 0); // Amount in paise
    if (refundableAmount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "No refundable amount available",
      });
    }

    // Process refund with the correct refundable amount
    const refund: any = await razorpay.payments.refund(booking.paymentId, {
      amount: refundableAmount, // Use the actual refundable amount
    });

    // Update Showtime
    const showtime = booking.showtimeId as any;
    const canceledSeats = booking.seats.map((seat: any) => {
      const rowStr = seat.seatNumber.match(/[A-Za-z]+/)?.[0];
      const seatStr = seat.seatNumber.match(/\d+/)?.[0];
      const row = rowStr!.charCodeAt(0) - "A".charCodeAt(0) + 1;
      const seatNum = parseInt(seatStr!);
      return { row, seat: seatNum, categoryId: seat.seatType };
    });

    showtime.bookedSeat = showtime.bookedSeat.filter(
      (booked: any) =>
        !canceledSeats.some(
          (canceledSeat: any) =>
            canceledSeat.row === booked.row &&
            canceledSeat.seat === booked.seat &&
            canceledSeat.categoryId === booked.categoryId
        )
    );
    showtime.avaliableSeats += booking.seats.length;

    if (showtime.avaliableSeats === showtime.totalSeats) {
      showtime.status = "avaliable"; // Typo: should be "available"
    } else if (showtime.avaliableSeats > showtime.totalSeats * 0.2) {
      showtime.status = "avaliable"; // Typo: should be "available"
    } else {
      showtime.status = "high demand";
    }

    // Update booking status
    booking.transactionStatus = "Refunded";

    await showtime.save({ session });
    await booking.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: booking,
      refund: { id: refund.id, amount: refund.amount },
      message: `Booking canceled successfully. Refund of ₹${(refund.amount / 100).toFixed(2)} processed.`,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error canceling booking",
      error: error instanceof Error ? error.message : error,
    });
  } finally {
    session.endSession();
  }
};

export const addReview = async (req: any, res: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { showtimeId, rating, content } = req.body;
    const userId = req.user?.id; // Assuming user ID comes from auth middleware

    if (!userId) {
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!showtimeId || !rating || !content) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Showtime ID, rating, and content are required',
      });
    }

    if (rating < 1 || rating > 5) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const showtime = await Showtime.findById(showtimeId).session(session);
    if (!showtime) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    // Check if user already reviewed this showtime
    const existingReview = showtime.review.find(
      (r) => r.userId.toString() === userId
    );
    if (existingReview) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this showtime',
      });
    }

    // Add new review
    const newReview = {
      userId,
      rating,
      content,
      createdAt: new Date(),
    };

    showtime.review.push(newReview);

    await showtime.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: newReview,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error instanceof Error ? error.message : error,
    });
  } finally {
    session.endSession();
  }
};