const Booking = require('../models/Booking');
const Sport = require('../models/Sport');
const Court = require('../models/Court');


// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { courtId, userId, sportId, organizationId, startTime, endTime, paymentType, bookingNote, discountAmount, totalAmount } = req.body;
    //const organizationId = req.headers['organizationId'];

    if (!courtId || !userId || !sportId || !startTime || !endTime || !organizationId) {
      console.log(courtId, userId, sportId, startTime, endTime, organizationId);
      return res.status(400).json({ message: 'All fields are required.' });

    }

    // Parsing startTime and endTime
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({ message: 'Invalid date or time format.' });
    }

    const court = await Court.findOne({ _id: courtId, organizationId, isActive: true });
    if (!court) {
      return res.status(404).json({ message: 'Court not found or inactive.' });
    }

    const newBooking = new Booking({
      courtId,
      userId,
      sportId,
      organizationId,
      startTime: startDateTime,
      endTime: endDateTime,
      paymentType,
      bookingNote,
      discountAmount,
      totalAmount,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error });
  }
};

// Get all bookings for an organization
exports.getBookings = async (req, res) => {
  try {
    const organizationId = req.headers['Organizationid'] || req.headers['OrganizationId'] || req.headers['organizationId'] || req.headers['organizationid'];

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization name is required.' });
    }

    const bookings = await Booking.find({ organizationId: organizationId })
      .populate('courtId')
      .populate('userId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};
